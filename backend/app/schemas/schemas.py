"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    subscription_tier: str
    ai_queries_today: int
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Question schemas
class QuestionBase(BaseModel):
    question_text: str
    options: Dict[str, str]  # {"a": "option1", "b": "option2", "c": "option3", "d": "option4"}
    correct_answer: str
    explanations: Optional[Dict[str, str]] = None
    hints: Optional[List[str]] = None
    chapter_name: str
    chapter_number: int
    difficulty_level: str
    tags: Optional[List[str]] = None


class QuestionCreate(QuestionBase):
    question_id: str


class QuestionResponse(QuestionBase):
    id: int
    question_id: str
    question_type: str
    source: Optional[str]
    language: str
    grade: str
    subject: str
    created_date: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class QuestionPractice(BaseModel):
    """Question for practice (without correct answer and explanations)"""
    id: int
    question_id: str
    question_text: str
    options: Dict[str, str]
    hints: Optional[List[str]] = None
    chapter_name: str
    chapter_number: int
    difficulty_level: str
    tags: Optional[List[str]] = None


# Answer schemas
class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_spent: Optional[int] = None  # seconds


class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    user_answer: str


# Filter schemas
class QuestionFilter(BaseModel):
    chapter_numbers: Optional[List[int]] = None
    difficulty_levels: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    question_types: Optional[List[str]] = None
    limit: Optional[int] = 10
    offset: Optional[int] = 0


# Mark schemas
class MarkCreate(BaseModel):
    question_id: int
    mark_type: str = "review"
    notes: Optional[str] = None


class MarkResponse(BaseModel):
    id: int
    question_id: int
    mark_type: str
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Analytics schemas
class UserStats(BaseModel):
    total_questions_attempted: int
    correct_answers: int
    accuracy_percentage: float
    total_time_spent: int  # seconds
    average_time_per_question: float
    questions_by_difficulty: Dict[str, int]
    questions_by_chapter: Dict[str, int]


class ChapterProgress(BaseModel):
    chapter_number: int
    chapter_name: str
    total_questions: int
    attempted_questions: int
    correct_answers: int
    accuracy_percentage: float


class AnalyticsResponse(BaseModel):
    user_stats: UserStats
    chapter_progress: List[ChapterProgress]
    recent_activity: List[Dict[str, Any]]