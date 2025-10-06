"""
Analytics and user progress endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.core.database import get_db
from app.api.auth import get_current_user
from app.crud.analytics import get_user_stats, get_chapter_progress, get_recent_activity, get_leaderboard
from app.schemas.schemas import UserResponse, AnalyticsResponse, UserStats, ChapterProgress

router = APIRouter()


@router.get("/", response_model=AnalyticsResponse)
async def get_user_analytics(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user analytics"""
    try:
        # Get user statistics
        user_stats_data = get_user_stats(db, current_user.id)
        user_stats = UserStats(**user_stats_data)
        
        # Get chapter progress
        chapter_progress_data = get_chapter_progress(db, current_user.id)
        chapter_progress = [ChapterProgress(**chapter) for chapter in chapter_progress_data]
        
        # Get recent activity
        recent_activity = get_recent_activity(db, current_user.id, limit=20)
        
        logger.info(f"Analytics requested by user: {current_user.username}")
        
        return AnalyticsResponse(
            user_stats=user_stats,
            chapter_progress=chapter_progress,
            recent_activity=recent_activity
        )
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics"
        )


@router.get("/stats", response_model=UserStats)
async def get_user_statistics(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics only"""
    try:
        user_stats_data = get_user_stats(db, current_user.id)
        return UserStats(**user_stats_data)
        
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user statistics"
        )


@router.get("/progress")
async def get_progress(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's progress by chapter"""
    try:
        chapter_progress_data = get_chapter_progress(db, current_user.id)
        return {"chapter_progress": chapter_progress_data}
        
    except Exception as e:
        logger.error(f"Progress error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get progress"
        )


@router.get("/recent")
async def get_recent_user_activity(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's recent activity"""
    try:
        recent_activity = get_recent_activity(db, current_user.id, limit=50)
        return {"recent_activity": recent_activity}
        
    except Exception as e:
        logger.error(f"Recent activity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent activity"
        )


@router.get("/leaderboard")
async def get_analytics_leaderboard(
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get leaderboard of top performers"""
    try:
        leaderboard_data = get_leaderboard(db, limit=limit)
        return {"leaderboard": leaderboard_data}
        
    except Exception as e:
        logger.error(f"Leaderboard error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get leaderboard"
        )