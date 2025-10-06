"""
CRUD operations for UserActivity and analytics
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, case
from app.models.models import UserActivity, Question, Mark
from app.schemas.schemas import AnswerSubmission
from typing import List, Dict, Any, Optional
from datetime import datetime


def record_user_activity(
    db: Session, 
    user_id: int, 
    submission: AnswerSubmission,
    is_correct: bool
) -> UserActivity:
    """Record user's answer submission"""
    # Check if this is a repeat attempt
    existing_activity = db.query(UserActivity).filter(
        and_(
            UserActivity.user_id == user_id,
            UserActivity.question_id == submission.question_id
        )
    ).first()
    
    attempt_number = 1
    if existing_activity:
        # Get the highest attempt number for this user-question pair
        max_attempt = db.query(func.max(UserActivity.attempt_number)).filter(
            and_(
                UserActivity.user_id == user_id,
                UserActivity.question_id == submission.question_id
            )
        ).scalar() or 0
        attempt_number = max_attempt + 1
    
    activity = UserActivity(
        user_id=user_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        time_spent=submission.time_spent,
        attempt_number=attempt_number,
        completed_at=datetime.utcnow()
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def get_user_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """Get comprehensive user statistics"""
    # Basic stats
    total_activities = db.query(UserActivity).filter(
        UserActivity.user_id == user_id
    ).count()
    
    correct_answers = db.query(UserActivity).filter(
        and_(
            UserActivity.user_id == user_id,
            UserActivity.is_correct == True
        )
    ).count()
    
    total_time = db.query(func.sum(UserActivity.time_spent)).filter(
        and_(
            UserActivity.user_id == user_id,
            UserActivity.time_spent.isnot(None)
        )
    ).scalar() or 0
    
    # Questions by difficulty
    difficulty_stats = db.query(
        Question.difficulty_level,
        func.count(UserActivity.id).label('count')
    ).join(UserActivity).filter(
        UserActivity.user_id == user_id
    ).group_by(Question.difficulty_level).all()
    
    # Questions by chapter
    chapter_stats = db.query(
        Question.chapter_number,
        Question.chapter_name,
        func.count(UserActivity.id).label('count')
    ).join(UserActivity).filter(
        UserActivity.user_id == user_id
    ).group_by(Question.chapter_number, Question.chapter_name).all()
    
    accuracy = (correct_answers / total_activities * 100) if total_activities > 0 else 0
    avg_time = (total_time / total_activities) if total_activities > 0 else 0
    
    return {
        'total_questions_attempted': total_activities,
        'correct_answers': correct_answers,
        'accuracy_percentage': round(accuracy, 2),
        'total_time_spent': total_time,
        'average_time_per_question': round(avg_time, 2),
        'questions_by_difficulty': {
            row.difficulty_level: row.count for row in difficulty_stats
        },
        'questions_by_chapter': {
            f"Ch{row.chapter_number}: {row.chapter_name}": row.count 
            for row in chapter_stats
        }
    }


def get_chapter_progress(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """Get user's progress by chapter"""
    # Get total questions per chapter
    chapter_totals = db.query(
        Question.chapter_number,
        Question.chapter_name,
        func.count(Question.id).label('total_questions')
    ).filter(Question.is_active == True).group_by(
        Question.chapter_number, Question.chapter_name
    ).all()
    
    # Get user's attempts per chapter
    user_attempts = db.query(
        Question.chapter_number,
        func.count(UserActivity.id).label('attempted'),
        func.sum(case((UserActivity.is_correct, 1), else_=0)).label('correct')
    ).join(UserActivity).filter(
        UserActivity.user_id == user_id
    ).group_by(Question.chapter_number).all()
    
    # Combine data
    attempts_dict = {row.chapter_number: row for row in user_attempts}
    
    progress = []
    for chapter in chapter_totals:
        attempt_data = attempts_dict.get(chapter.chapter_number)
        attempted = attempt_data.attempted if attempt_data else 0
        correct = attempt_data.correct if attempt_data else 0
        
        accuracy = (correct / attempted * 100) if attempted > 0 else 0
        
        progress.append({
            'chapter_number': chapter.chapter_number,
            'chapter_name': chapter.chapter_name,
            'total_questions': chapter.total_questions,
            'attempted_questions': attempted,
            'correct_answers': correct,
            'accuracy_percentage': round(accuracy, 2)
        })
    
    return progress


def get_recent_activity(db: Session, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    """Get user's recent activity"""
    activities = db.query(UserActivity, Question).join(Question).filter(
        UserActivity.user_id == user_id
    ).order_by(desc(UserActivity.completed_at)).limit(limit).all()
    
    result = []
    for activity, question in activities:
        result.append({
            'question_id': question.question_id,
            'question_text': question.question_text[:100] + "..." if len(question.question_text) > 100 else question.question_text,
            'chapter_name': question.chapter_name,
            'difficulty_level': question.difficulty_level,
            'user_answer': activity.user_answer,
            'is_correct': activity.is_correct,
            'time_spent': activity.time_spent,
            'completed_at': activity.completed_at.isoformat() if activity.completed_at else None
        })
    
    return result


def create_mark(db: Session, user_id: int, question_id: int, mark_type: str = "review", notes: str = None) -> Mark:
    """Create a bookmark/mark for a question"""
    # Check if mark already exists
    existing_mark = db.query(Mark).filter(
        and_(
            Mark.user_id == user_id,
            Mark.question_id == question_id,
            Mark.mark_type == mark_type
        )
    ).first()
    
    if existing_mark:
        # Update existing mark
        existing_mark.notes = notes
        db.commit()
        db.refresh(existing_mark)
        return existing_mark
    
    mark = Mark(
        user_id=user_id,
        question_id=question_id,
        mark_type=mark_type,
        notes=notes
    )
    
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark


def get_user_marks(db: Session, user_id: int, mark_type: Optional[str] = None) -> List[Mark]:
    """Get user's bookmarks/marks"""
    query = db.query(Mark).filter(Mark.user_id == user_id)
    
    if mark_type:
        query = query.filter(Mark.mark_type == mark_type)
    
    return query.order_by(desc(Mark.created_at)).all()


def remove_mark(db: Session, user_id: int, mark_id: int) -> bool:
    """Remove a bookmark/mark"""
    mark = db.query(Mark).filter(
        and_(Mark.id == mark_id, Mark.user_id == user_id)
    ).first()
    
    if mark:
        db.delete(mark)
        db.commit()
        return True
    
    return False


def get_leaderboard(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Get leaderboard data based on user performance"""
    from app.models.models import User
    
    # Calculate user statistics for leaderboard
    leaderboard_data = db.query(
        User.id,
        User.username,
        User.full_name,
        func.count(UserActivity.id).label('total_questions'),
        func.sum(case((UserActivity.is_correct == True, 1), else_=0)).label('correct_answers'),
        (func.sum(case((UserActivity.is_correct == True, 1), else_=0)) * 100.0 / 
         func.count(UserActivity.id)).label('accuracy'),
        func.sum(UserActivity.time_spent).label('total_time')
    ).join(
        UserActivity, User.id == UserActivity.user_id
    ).filter(
        User.is_active == True
    ).group_by(
        User.id, User.username, User.full_name
    ).having(
        func.count(UserActivity.id) > 0  # Only users who have answered questions
    ).order_by(
        desc('accuracy'), desc('total_questions')  # Order by accuracy first, then total questions
    ).limit(limit).all()
    
    return [
        {
            'user_id': row.id,
            'username': row.username,
            'full_name': row.full_name,
            'total_questions': row.total_questions,
            'correct_answers': row.correct_answers,
            'accuracy': round(row.accuracy, 1) if row.accuracy else 0,
            'total_time': row.total_time or 0,
            'rank': idx + 1
        }
        for idx, row in enumerate(leaderboard_data)
    ]