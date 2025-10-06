"""
CRUD operations for UserActivity and analytics
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, case
from app.models.models import UserActivity, Question, Mark
from app.schemas.schemas import AnswerSubmission
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


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


def get_real_time_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """Get real-time statistics for live dashboard updates"""
    # Current session stats (today)
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    today_activities = db.query(UserActivity).filter(
        and_(
            UserActivity.user_id == user_id,
            UserActivity.completed_at >= today_start
        )
    ).all()
    
    today_total = len(today_activities)
    today_correct = sum(1 for activity in today_activities if activity.is_correct)
    today_time = sum(activity.time_spent for activity in today_activities if activity.time_spent)
    today_accuracy = (today_correct / today_total * 100) if today_total > 0 else 0
    
    # Overall stats
    overall_stats = get_user_stats(db, user_id)
    chapter_progress = get_chapter_progress(db, user_id)

    # Recent streak
    recent_activities = db.query(UserActivity).filter(
        UserActivity.user_id == user_id
    ).order_by(desc(UserActivity.completed_at)).limit(10).all()
    
    current_streak = 0
    for activity in recent_activities:
        if activity.is_correct:
            current_streak += 1
        else:
            break
    
    return {
        "today": {
            "questions_attempted": today_total,
            "correct_answers": today_correct,
            "accuracy": round(today_accuracy, 1),
            "time_spent": today_time,
            "current_streak": current_streak
        },
        "overall": overall_stats,
        "chapter_progress": chapter_progress,
        "last_updated": datetime.utcnow().isoformat()
    }


def get_performance_trends(db: Session, user_id: int, days: int = 30) -> List[Dict[str, Any]]:
    """Get performance trends over the specified number of days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Group activities by date
    daily_stats = db.query(
        func.date(UserActivity.completed_at).label('date'),
        func.count(UserActivity.id).label('total'),
        func.sum(case((UserActivity.is_correct == True, 1), else_=0)).label('correct'),
        func.sum(UserActivity.time_spent).label('time_spent')
    ).filter(
        and_(
            UserActivity.user_id == user_id,
            UserActivity.completed_at >= start_date,
            UserActivity.completed_at <= end_date
        )
    ).group_by(
        func.date(UserActivity.completed_at)
    ).order_by(
        func.date(UserActivity.completed_at)
    ).all()
    
    trends = []
    for stat in daily_stats:
        accuracy = (stat.correct / stat.total * 100) if stat.total > 0 else 0
        trends.append({
            "date": stat.date.isoformat(),
            "questions_attempted": stat.total,
            "correct_answers": stat.correct,
            "accuracy": round(accuracy, 1),
            "time_spent": stat.time_spent or 0,
            "avg_time_per_question": round((stat.time_spent or 0) / stat.total, 1) if stat.total > 0 else 0
        })
    
    return trends


def get_detailed_analytics(db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
    """Get detailed analytics including patterns and insights"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get activities in date range, joining with Question to get metadata
    activities_query = db.query(UserActivity, Question).join(Question).filter(
        and_(
            UserActivity.user_id == user_id,
            UserActivity.completed_at >= start_date
        )
    )
    
    activities_with_questions = activities_query.all()
    
    if not activities_with_questions:
        return {
            "insights": {
                "total_practice_time": 0,
                "average_session_length": 0,
                "peak_performance_hour": None,
                "improvement_areas": [],
                "strengths": []
            },
            "patterns": {
                "most_active_day": None,
                "preferred_difficulty": None,
                "consistency_score": 0
            },
            "trends": []
        }
    
    activities = [aq[0] for aq in activities_with_questions]
    
    # Chapter performance for strengths/weaknesses
    chapter_performance = {}
    for activity, question in activities_with_questions:
        chapter = question.chapter_name
        if chapter not in chapter_performance:
            chapter_performance[chapter] = {"total": 0, "correct": 0}
        chapter_performance[chapter]["total"] += 1
        if activity.is_correct:
            chapter_performance[chapter]["correct"] += 1
            
    chapter_accuracy = []
    for chapter, stats in chapter_performance.items():
        if stats["total"] > 0:
            accuracy = (stats["correct"] / stats["total"]) * 100
            chapter_accuracy.append({"chapter": chapter, "accuracy": accuracy, "total": stats["total"]})
            
    chapter_accuracy.sort(key=lambda x: x["accuracy"])
    
    improvement_areas = [{"name": item["chapter"], "accuracy": round(item["accuracy"])} for item in chapter_accuracy if item["total"] >= 5 and item["accuracy"] < 70]
    strengths = [{"name": item["chapter"], "accuracy": round(item["accuracy"])} for item in reversed(chapter_accuracy) if item["total"] >= 5 and item["accuracy"] >= 85]

    # Difficulty preference
    difficulty_stats = {}
    for _, question in activities_with_questions:
        level = question.difficulty_level
        difficulty_stats[level] = difficulty_stats.get(level, 0) + 1
    
    preferred_difficulty = max(difficulty_stats.keys(), key=lambda k: difficulty_stats[k]) if difficulty_stats else None

    # Time-based patterns
    hourly_performance = {}
    daily_performance = {}
    
    for activity in activities:
        if not activity.completed_at: continue
        hour = activity.completed_at.hour
        day = activity.completed_at.strftime('%A')
        
        if hour not in hourly_performance:
            hourly_performance[hour] = {"total": 0, "correct": 0}
        if day not in daily_performance:
            daily_performance[day] = {"total": 0, "correct": 0}
        
        hourly_performance[hour]["total"] += 1
        daily_performance[day]["total"] += 1
        
        if activity.is_correct:
            hourly_performance[hour]["correct"] += 1
            daily_performance[day]["correct"] += 1
            
    best_hour = None
    best_accuracy = -1
    if hourly_performance:
        for hour, stats in hourly_performance.items():
            if stats["total"] >= 3:  # Minimum 3 questions
                accuracy = stats["correct"] / stats["total"]
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_hour = hour

    most_active_day = max(daily_performance.keys(), key=lambda x: daily_performance[x]["total"]) if daily_performance else None
    
    dates = [activity.completed_at.date() for activity in activities if activity.completed_at]
    unique_dates = set(dates)
    consistency_score = len(unique_dates) / days * 100 if days > 0 else 0
    
    total_time = sum(activity.time_spent for activity in activities if activity.time_spent)
    avg_session_length = total_time / len(unique_dates) if unique_dates else 0
    
    trends = get_performance_trends(db, user_id, days)
    
    return {
        "insights": {
            "total_practice_time": total_time,
            "average_session_length": round(avg_session_length, 1),
            "peak_performance_hour": f"{best_hour}:00" if best_hour is not None else None,
            "improvement_areas": improvement_areas[:3],
            "strengths": strengths[:3]
        },
        "patterns": {
            "most_active_day": most_active_day,
            "preferred_difficulty": preferred_difficulty,
            "consistency_score": round(consistency_score, 1)
        },
        "trends": trends
    }


def record_session_start(db: Session, user_id: int):
    """Record the start of a practice session"""
    from app.models.models import User
    
    # For now, we'll track this in user activities, but could create a separate Sessions table
    # This is a simplified implementation
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.updated_at = datetime.utcnow()
        db.commit()
        return user
    return None


def record_session_end(db: Session, user_id: int, session_id: int):
    """Record the end of a practice session"""
    from app.models.models import User
    
    # Simplified implementation - in a real system you'd have a Sessions table
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.updated_at = datetime.utcnow()
        # Calculate duration (would be better with actual session tracking)
        duration = 0  # This would be calculated from session start/end times
        user.duration = duration  # This field doesn't exist, just for example
        db.commit()
        return user
    return None
