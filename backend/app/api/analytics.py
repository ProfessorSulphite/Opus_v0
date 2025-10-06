"""
Enhanced Analytics and Real-time Assessment endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from loguru import logger
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from app.core.database import get_db
from app.api.auth import get_current_user
from app.crud.analytics import (
    get_user_stats, get_chapter_progress, get_recent_activity, 
    get_leaderboard, get_performance_trends, get_detailed_analytics,
    get_real_time_stats, record_session_start, record_session_end,
    reset_user_analytics
)
from app.schemas.schemas import UserResponse, AnalyticsResponse, UserStats, ChapterProgress
from app.models.models import UserActivity, Question
from app.ws_manager import manager

logger.info("Reloading analytics.py...")

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time analytics updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for keepalive
            await websocket.send_text(f"User {user_id} connected")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


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


@router.get("/real-time-stats")
async def get_real_time_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time statistics for dashboard updates"""
    try:
        stats = get_real_time_stats(db, current_user.id)
        
        # Broadcast to connected clients
        await manager.broadcast(json.dumps({
            "type": "stats_update",
            "user_id": current_user.id,
            "data": stats
        }))
        
        return stats
        
    except Exception as e:
        logger.error(f"Real-time stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get real-time statistics"
        )


@router.get("/detailed")
async def get_detailed_analytics_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get detailed analytics with trends and patterns"""
    try:
        analytics = get_detailed_analytics(db, current_user.id, days)
        return analytics
        
    except Exception as e:
        logger.error(f"Detailed analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get detailed analytics"
        )


@router.get("/trends")
async def get_performance_trends_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get performance trends over time"""
    try:
        trends = get_performance_trends(db, current_user.id, days)
        return {"trends": trends}
        
    except Exception as e:
        logger.error(f"Trends error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get performance trends"
        )


@router.post("/session/start")
async def start_practice_session(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record the start of a practice session"""
    try:
        session = record_session_start(db, current_user.id)
        
        # Broadcast session start
        await manager.broadcast(json.dumps({
            "type": "session_start",
            "user_id": current_user.id,
            "session_id": session.id,
            "timestamp": session.created_at.isoformat()
        }))
        
        return {"session_id": session.id, "started_at": session.created_at}
        
    except Exception as e:
        logger.error(f"Session start error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start session"
        )


@router.post("/session/end/{session_id}")
async def end_practice_session(
    session_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record the end of a practice session"""
    try:
        session = record_session_end(db, current_user.id, session_id)
        
        # Get updated stats
        updated_stats = get_real_time_stats(db, current_user.id)
        
        # Broadcast session end with updated stats
        await manager.broadcast(json.dumps({
            "type": "session_end",
            "user_id": current_user.id,
            "session_id": session_id,
            "duration": session.duration,
            "updated_stats": updated_stats
        }))
        
        return {
            "session_id": session_id, 
            "duration": session.duration,
            "ended_at": session.updated_at,
            "updated_stats": updated_stats
        }
        
    except Exception as e:
        logger.error(f"Session end error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end session"
        )

@router.post("/reset")
async def reset_analytics(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset all analytics for the current user."""
    try:
        num_deleted = reset_user_analytics(db, current_user.id)
        logger.info(f"Analytics reset for user {current_user.username}. {num_deleted} activities deleted.")
        
        # Broadcast reset event
        await manager.broadcast(json.dumps({
            "type": "analytics_reset",
            "user_id": current_user.id
        }))
        
        return {"message": "Analytics reset successfully.", "deleted_activities": num_deleted}
    except Exception as e:
        logger.error(f"Analytics reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset analytics"
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