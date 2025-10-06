"""
EduTheo Backend Application
FastAPI-based MCQ practice system for 9th grade Physics
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from loguru import logger
import os
from pathlib import Path

from app.core.config import settings
from app.core.database import get_db, engine
from app.models import models
from app.api import auth, questions, analytics

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="EduTheo API",
    description="MCQ Practice System for 9th Grade Physics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logger.add(
    "logs/edutheo.log",
    rotation="1 day",
    retention="30 days",
    level="INFO"
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(questions.router, prefix="/api/v1/questions", tags=["questions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "EduTheo API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Detailed health check including database connectivity"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )