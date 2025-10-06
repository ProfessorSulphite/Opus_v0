"""
Question and MCQ practice endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger
import json

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import Question
from app.crud.question import (
    get_question_by_id, 
    get_questions_filtered, 
    get_random_question,
    get_chapter_summary,
    get_all_tags,
    get_wrongly_answered_question_ids,
    get_attempted_question_ids,
    get_questions_by_ids
)
from app.crud.analytics import record_user_activity, create_mark, get_user_marks, remove_mark, get_real_time_stats
from app.schemas.schemas import (
    UserResponse, 
    QuestionResponse, 
    QuestionPractice, 
    QuestionFilter,
    AnswerSubmission,
    AnswerResponse,
    MarkCreate,
    MarkResponse
)
from app.ws_manager import manager

router = APIRouter()


@router.post("/filter")
async def filter_questions(
    filters: QuestionFilter,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Filter questions based on criteria"""
    try:
        questions, total_count = get_questions_filtered(db, filters, current_user.id)
        
        # Convert to practice format (hide answers and explanations)
        practice_questions = [
            QuestionPractice(
                id=q.id,
                question_id=q.question_id,
                question_text=q.question_text,
                options=q.options,
                hints=q.hints,
                chapter_name=q.chapter_name,
                chapter_number=q.chapter_number,
                difficulty_level=q.difficulty_level,
                tags=q.tags
            )
            for q in questions
        ]
        
        return {
            "questions": practice_questions,
            "total_count": total_count,
            "page_info": {
                "limit": filters.limit,
                "offset": filters.offset,
                "has_more": total_count > (filters.offset + filters.limit)
            }
        }
        
    except Exception as e:
        logger.error(f"Filter questions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to filter questions"
        )


@router.post("/get_question")
async def get_practice_question(
    filters: QuestionFilter,
    exclude_attempted: bool = Query(False, description="Exclude already attempted questions"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a random question for practice based on filters"""
    try:
        question = get_random_question(db, filters, current_user.id, exclude_attempted)
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No questions found matching the criteria"
            )
        
        # Return in practice format (hide answer and explanations)
        practice_question = QuestionPractice(
            id=question.id,
            question_id=question.question_id,
            question_text=question.question_text,
            options=question.options,
            hints=question.hints,
            chapter_name=question.chapter_name,
            chapter_number=question.chapter_number,
            difficulty_level=question.difficulty_level,
            tags=question.tags
        )
        
        return practice_question
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get question error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get question"
        )


@router.post("/check_answer", response_model=AnswerResponse)
async def check_answer(
    submission: AnswerSubmission,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check user's answer and record activity"""
    try:
        # Get the question
        question = get_question_by_id(db, submission.question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Check if answer is correct
        is_correct = submission.user_answer.lower() == question.correct_answer.lower()
        
        # Record user activity
        record_user_activity(db, current_user.id, submission, is_correct)

        # Broadcast real-time stats update
        stats = get_real_time_stats(db, current_user.id)
        await manager.broadcast(json.dumps({
            "type": "stats_update",
            "user_id": current_user.id,
            "data": stats
        }))

        # Get explanation for the user's answer
        explanation = None
        if question.explanations and submission.user_answer in question.explanations:
            explanation = question.explanations[submission.user_answer]
        elif question.explanations and question.correct_answer in question.explanations:
            explanation = question.explanations[question.correct_answer]
        
        logger.info(f"Answer checked for user {current_user.username}: question {question.question_id}, correct: {is_correct}")
        
        return AnswerResponse(
            is_correct=is_correct,
            correct_answer=question.correct_answer,
            explanation=explanation,
            user_answer=submission.user_answer
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Check answer error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check answer"
        )


@router.post("/mark", response_model=MarkResponse)
async def mark_question(
    mark_data: MarkCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark/bookmark a question for review"""
    try:
        # Verify question exists
        question = get_question_by_id(db, mark_data.question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Create mark
        mark = create_mark(db, current_user.id, mark_data.question_id, mark_data.mark_type, mark_data.notes)
        
        logger.info(f"Question marked by user {current_user.username}: question {mark_data.question_id}")
        
        return MarkResponse.from_orm(mark)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark question error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark question"
        )


@router.get("/marks", response_model=List[MarkResponse])
async def get_marks(
    mark_type: Optional[str] = Query(None, description="Filter by mark type"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's bookmarked questions"""
    try:
        marks = get_user_marks(db, current_user.id, mark_type)
        return [MarkResponse.from_orm(mark) for mark in marks]
        
    except Exception as e:
        logger.error(f"Get marks error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get marks"
        )


@router.delete("/marks/{mark_id}")
async def remove_mark_endpoint(
    mark_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a bookmark"""
    try:
        success = remove_mark(db, current_user.id, mark_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mark not found"
            )
        
        return {"message": "Mark removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remove mark error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove mark"
        )


@router.get("/chapters")
async def get_chapters(db: Session = Depends(get_db)):
    """Get summary of all chapters"""
    try:
        # Simple test query first
        total_questions = db.query(Question).filter(Question.is_active == True).count()
        logger.info(f"Total questions in DB: {total_questions}")
        
        chapters = get_chapter_summary(db)
        logger.info(f"Chapters retrieved: {len(chapters)}")
        return {"chapters": chapters}
        
    except Exception as e:
        logger.error(f"Get chapters error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chapters"
        )


@router.get("/tags")
async def get_tags(db: Session = Depends(get_db)):
    """Get all available tags"""
    try:
        tags = get_all_tags(db)
        return {"tags": tags}
        
    except Exception as e:
        logger.error(f"Get tags error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tags"
        )
        
@router.get("/topics")
async def get_topics(db: Session = Depends(get_db)):
    """Use chapters as topics"""
    try:
        chapters = get_chapter_summary(db)
        topics = [
            {
                "name": f"Chapter {chap['chapter_number']}: {chap['chapter_name']}",
                "value": chap['chapter_name']
            } 
            for chap in chapters
        ]
        return {"topics": topics}
    except Exception as e:
        logger.error(f"Get topics error: {str(e)}")
        return {"topics": []}


@router.get("/count")
async def get_questions_count(db: Session = Depends(get_db)):
    """Get the total number of active questions."""
    try:
        count = db.query(Question).filter(Question.is_active == True).count()
        return {"total_count": count}
    except Exception as e:
        logger.error(f"Get questions count error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get question count"
        )

@router.get("/review/wrong", response_model=List[QuestionResponse])
async def get_wrong_questions_for_review(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all questions the user has answered incorrectly."""
    try:
        question_ids = get_wrongly_answered_question_ids(db, current_user.id)
        questions = get_questions_by_ids(db, question_ids)
        return questions
    except Exception as e:
        logger.error(f"Get wrong questions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get questions for review"
        )

@router.get("/review/attempted", response_model=List[QuestionResponse])
async def get_attempted_questions_for_review(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all questions the user has attempted."""
    try:
        question_ids = get_attempted_question_ids(db, current_user.id)
        questions = get_questions_by_ids(db, question_ids)
        return questions
    except Exception as e:
        logger.error(f"Get attempted questions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get questions for review"
        )
