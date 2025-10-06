"""
CRUD operations for Question model
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from app.models.models import Question, UserActivity
from app.schemas.schemas import QuestionCreate, QuestionFilter
from typing import List, Optional, Tuple
import random


def create_question(db: Session, question: QuestionCreate) -> Question:
    """Create a new question"""
    db_question = Question(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


def get_question_by_id(db: Session, question_id: int) -> Optional[Question]:
    """Get question by ID"""
    return db.query(Question).filter(
        and_(Question.id == question_id, Question.is_active == True)
    ).first()


def get_question_by_question_id(db: Session, question_id: str) -> Optional[Question]:
    """Get question by question_id (PHY09-CH01-MCQ0001)"""
    return db.query(Question).filter(
        and_(Question.question_id == question_id, Question.is_active == True)
    ).first()


def get_questions_filtered(
    db: Session, 
    filters: QuestionFilter, 
    user_id: Optional[int] = None
) -> Tuple[List[Question], int]:
    """Get filtered questions with pagination"""
    query = db.query(Question).filter(Question.is_active == True)
    
    # Apply filters
    if filters.chapter_numbers:
        query = query.filter(Question.chapter_number.in_(filters.chapter_numbers))
    
    if filters.difficulty_levels:
        query = query.filter(Question.difficulty_level.in_(filters.difficulty_levels))
    
    if filters.question_types:
        query = query.filter(Question.question_type.in_(filters.question_types))
    
    if filters.tags:
        # Filter by tags (JSON array contains any of the specified tags)
        for tag in filters.tags:
            query = query.filter(Question.tags.contains(f'"{tag}"'))
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination
    questions = query.offset(filters.offset).limit(filters.limit).all()
    
    return questions, total_count


def get_random_question(
    db: Session, 
    filters: QuestionFilter, 
    user_id: Optional[int] = None,
    exclude_attempted: bool = False
) -> Optional[Question]:
    """Get a random question based on filters"""
    query = db.query(Question).filter(Question.is_active == True)
    
    # Apply filters
    if filters.chapter_numbers:
        query = query.filter(Question.chapter_number.in_(filters.chapter_numbers))
    
    if filters.difficulty_levels:
        query = query.filter(Question.difficulty_level.in_(filters.difficulty_levels))
    
    if filters.question_types:
        query = query.filter(Question.question_type.in_(filters.question_types))
    
    if filters.tags:
        for tag in filters.tags:
            query = query.filter(Question.tags.contains(f'"{tag}"'))
    
    # Exclude already attempted questions if requested
    if exclude_attempted and user_id:
        attempted_question_ids = db.query(UserActivity.question_id).filter(
            UserActivity.user_id == user_id
        ).subquery()
        query = query.filter(~Question.id.in_(attempted_question_ids))
    
    # Get all matching questions and pick random one
    questions = query.all()
    if not questions:
        return None
    
    return random.choice(questions)


def get_chapter_summary(db: Session) -> List[dict]:
    """Get summary of questions by chapter"""
    # Simplified approach - get basic counts by chapter and difficulty
    
    result = db.execute(text("""
        SELECT 
            chapter_number,
            chapter_name,
            COUNT(*) as total_questions,
            SUM(CASE WHEN difficulty_level = 'Easy' THEN 1 ELSE 0 END) as easy_questions,
            SUM(CASE WHEN difficulty_level = 'Medium' THEN 1 ELSE 0 END) as medium_questions,
            SUM(CASE WHEN difficulty_level = 'Hard' THEN 1 ELSE 0 END) as hard_questions
        FROM questions 
        WHERE is_active = 1 
        GROUP BY chapter_number, chapter_name 
        ORDER BY chapter_number
    """)).fetchall()
    
    return [
        {
            'chapter_number': row.chapter_number,
            'chapter_name': row.chapter_name,
            'total_questions': row.total_questions,
            'easy_questions': row.easy_questions,
            'medium_questions': row.medium_questions,
            'hard_questions': row.hard_questions
        }
        for row in result
    ]


def get_all_tags(db: Session) -> List[str]:
    """Get all unique tags from questions"""
    questions = db.query(Question.tags).filter(
        and_(Question.is_active == True, Question.tags.isnot(None))
    ).all()
    
    all_tags = set()
    for question in questions:
        if question.tags:
            all_tags.update(question.tags)
    
    return sorted(list(all_tags))