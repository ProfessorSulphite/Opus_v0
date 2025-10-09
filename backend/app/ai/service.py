"""
AI Chat Service

This module contains the service for handling the real AI chat agent, including
query limits, tool creation, and agent execution.
"""

from sqlalchemy.orm import Session
from datetime import date
from fastapi import HTTPException
from loguru import logger
import re
import json

from app.crud.user import get_user_by_id
from app.crud.analytics import get_detailed_analytics
from app.crud.question import get_question_by_question_id
from app.core.config import settings

# LangChain and Gemini Imports
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI


class AIAgentFactory:
    """Factory for creating the AI agent and its components."""

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.llm = self._create_llm()
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    def _create_llm(self):
        if not settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY is not set. AI Tutor cannot function.")
            return None
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", 
            google_api_key=settings.gemini_api_key, 
            convert_system_message_to_human=True,
            temperature=0.0  # Set to 0 for deterministic tool selection
        )

    def _get_analytics_report(self, _: str) -> str:
        """Tool function to get a user's detailed analytics report."""
        logger.info(f"AI Tool: Getting analytics for user {self.user_id}")
        analytics = get_detailed_analytics(self.db, self.user_id)
        if not analytics:
            return "No analytics data available for this user."
        return json.dumps(analytics)

    def _get_question_details(self, question_id: str) -> str:
        """
        Tool function to get details for a specific question by its ID.
        Includes robust validation for the question_id format.
        """
        logger.info(f"AI Tool: Getting details for question '{question_id}'")
        
        # Validate the question_id format using regex
        if not re.match(r"^[A-Z]{3}\d{2}-CH\d{2}-MCQ\d{4}$", question_id.strip()):
            logger.warning(f"Invalid question_id format: {question_id}")
            return f"Error: The provided question ID '{question_id}' is not in the correct format. Please ask the user for a valid ID (e.g., PHY09-CH01-MCQ0001)."

        question = get_question_by_question_id(self.db, question_id.strip())
        if not question:
            return f"Error: Question with ID '{question_id}' not found. Please ask the user to double-check the ID."
        
        details = {
            "Question": question.question_text,
            "Options": question.options,
            "Correct Answer": question.correct_answer,
            "Explanation": question.explanations
        }
        return json.dumps(details)

    def _general_conversation(self, user_input: str) -> str:
        """
        Tool for handling any general conversation, greetings, or questions that don't require data.
        It uses the LLM to generate a relevant conversational response.
        """
        logger.info(f"AI Tool: Handling general conversation for user {self.user_id}")
        
        # Use a simple, non-agentic prompt to generate a direct conversational response
        prompt = f"""You are EduTheo, a friendly and helpful physics tutor for 9th grade students. 

RESPONSE GUIDELINES:
- Keep responses concise (2-3 paragraphs maximum, 100-150 words)
- Use simple, clear language appropriate for 9th graders
- Structure your response with markdown formatting:
  * Use ## for main headings
  * Use **bold** for key concepts
  * Use bullet points for lists
  * Use code blocks for formulas when needed
- Focus on the most important points
- Encourage further questions

User's question: '{user_input}'

Provide a helpful, well-structured response using markdown formatting."""
        
        response = self.llm.invoke(prompt)
        return response.content

    def create_agent(self):
        if not self.llm:
            return None

        tools = [
            Tool(
                name="GetQuestionDetails",
                func=self._get_question_details,
                description="Use this tool ONLY when the user explicitly provides a specific question ID in the format PHY09-CH01-MCQ0001. Look for this exact pattern in the user's message.",
            ),
            Tool(
                name="GetUserAnalytics",
                func=self._get_analytics_report,
                description="Use this tool when the user asks about their performance, progress, study analytics, statistics, strengths, weaknesses, or wants suggestions based on their learning data.",
            ),
            Tool(
                name="GeneralConversation",
                func=self._general_conversation,
                description="Use this tool for greetings, general physics questions, explanations of physics concepts, help requests, or any conversation that doesn't require fetching specific question details or analytics data. This is the default tool for most interactions.",
            ),
        ]

        prompt_template = PromptTemplate.from_template("""You are EduTheo, an expert 9th-grade physics tutor. You must intelligently select the correct tool based on the user's input.

Tool Selection Logic:
1. If the user's input contains a question ID matching the pattern [A-Z]{{3}}\\d{{2}}-CH\\d{{2}}-MCQ\\d{{4}} (e.g., PHY09-CH01-MCQ0001), use GetQuestionDetails
2. If the user asks about their performance, progress, statistics, analytics, strengths, weaknesses, or wants study suggestions, use GetUserAnalytics
3. For all other cases (greetings, general physics questions, concept explanations, help requests), use GeneralConversation

IMPORTANT: After receiving the Observation from a tool, you MUST respond directly to the user based on that observation. Do NOT call another action.

You have access to the following tools:

{tools}

Use the following format EXACTLY:

Thought: [Analyze the user input and decide which tool to use based on the logic above]
Action: [The tool name from: {tool_names}]
Action Input: [The input for the tool]
Observation: [The result from the tool]
Thought: [Based on the observation, formulate your response to the user]
Final Answer: [Your helpful response to the user based on the observation]

Previous conversation history:
{chat_history}

User Input: {input}
{agent_scratchpad}""")

        agent = create_react_agent(self.llm, tools, prompt_template)
        
        return AgentExecutor(
            agent=agent, 
            tools=tools, 
            memory=self.memory, 
            verbose=True, 
            handle_parsing_errors=True,
            max_iterations=3,
            return_intermediate_steps=False
        )


class AIChatService:
    """Service to manage AI chat interactions and enforce business logic."""
    def __init__(self, user_id: int, db: Session):
        self.user_id = user_id
        self.db = db
        self.user = get_user_by_id(db, user_id)
        if not self.user:
            raise ValueError("User not found for AI Chat Service")
        
        agent_factory = AIAgentFactory(db=db, user_id=user_id)
        self.agent_executor = agent_factory.create_agent()

    def _verify_query_limit(self):
        """
        Checks if the user has exceeded their daily query limit.
        Resets the user's query count if it's a new day.
        """
        today = date.today()
        
        if self.user.last_ai_query_date != today:
            logger.info(f"New day for user {self.user.username}. Resetting AI query count.")
            self.user.last_ai_query_date = today
            self.user.ai_queries_today = 0
            self.db.commit()

        if self.user.subscription_tier == "base" and self.user.ai_queries_today >= 50:
            logger.warning(f"User {self.user.username} has reached their daily query limit.")
            raise HTTPException(
                status_code=429, 
                detail="Daily query limit reached. Upgrade to Pro for more queries."
            )

    def get_ai_response(self, message: str) -> str:
        """
        Processes the user's message, checks limits, and gets a response from the AI agent.
        """
        self._verify_query_limit()
        
        if not self.agent_executor:
            return "Sorry, the AI Tutor is not available. The API key may not be configured correctly."

        try:
            response = self.agent_executor.invoke({"input": message})
            
            self.user.ai_queries_today += 1
            self.db.commit()
            logger.info(f"User {self.user.username} query count for today: {self.user.ai_queries_today}")

            return response.get("output", "I'm not sure how to respond to that.")
        except Exception as e:
            logger.error(f"Error during AI agent execution for user {self.user_id}: {e}")
            # Do not increment query count on failure
            return "Sorry, I encountered an error. Please try again."

    async def get_ai_response_stream(self, message: str):
        """
        Processes the user's message, checks limits, and streams the response from the AI agent.
        Yields chunks of text as they become available with controlled speed.
        """
        import asyncio
        
        self._verify_query_limit()
        
        if not self.agent_executor:
            yield "Sorry, the AI Tutor is not available. The API key may not be configured correctly."
            return

        try:
            # Get the complete response from the agent
            response = self.agent_executor.invoke({"input": message})
            output_text = response.get("output", "I'm not sure how to respond to that.")
            
            # Increment query count on successful response
            self.user.ai_queries_today += 1
            self.db.commit()
            logger.info(f"User {self.user.username} query count for today: {self.user.ai_queries_today}")

            # Stream the response character by character with controlled speed
            for i, char in enumerate(output_text):
                yield char
                # Add small delay for natural typing effect (faster for spaces, slower for punctuation)
                if char in '.!?':
                    await asyncio.sleep(0.1)  # Pause at sentence endings
                elif char in ',;:':
                    await asyncio.sleep(0.05)  # Small pause at commas
                elif char == ' ':
                    await asyncio.sleep(0.02)  # Quick for spaces
                else:
                    await asyncio.sleep(0.01)  # Normal typing speed
                    
        except Exception as e:
            logger.error(f"Error during AI agent execution for user {self.user_id}: {e}")
            # Do not increment query count on failure
            yield "Sorry, I encountered an error. Please try again."