"""
SQLAlchemy models for EduTheo application
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model for authentication and profile management"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Subscription and AI usage
    subscription_tier = Column(String(20), default="base", nullable=False) # e.g., 'base', 'pro'
    ai_queries_today = Column(Integer, default=0, nullable=False)
    last_ai_query_date = Column(Date, nullable=True)
    
    # Relationships
    activities = relationship("UserActivity", back_populates="user")
    marks = relationship("Mark", back_populates="user")


class Question(Base):
    """Question model for MCQ storage"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(String(50), unique=True, index=True, nullable=False)  # PHY09-CH01-MCQ0001
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # {"a": "option1", "b": "option2", ...}
    correct_answer = Column(String(1), nullable=False)  # a, b, c, or d
    explanations = Column(JSON, nullable=True)  # {"a": "explanation1", ...}
    hints = Column(JSON, nullable=True)  # ["hint1", "hint2", ...]
    
    # Metadata
    chapter_name = Column(String(100), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    difficulty_level = Column(String(20), nullable=False)  # Easy, Medium, Hard
    question_type = Column(String(30), default="multiple_choice")
    source = Column(String(100), nullable=True)
    language = Column(String(10), default="English")
    grade = Column(String(10), default="9th")
    subject = Column(String(20), default="Physics")
    tags = Column(JSON, nullable=True)  # ["tag1", "tag2", ...]
    
    # Tracking
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    activities = relationship("UserActivity", back_populates="question")
    marks = relationship("Mark", back_populates="question")


class UserActivity(Base):
    """Track user interactions with questions"""
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Activity details
    user_answer = Column(String(1), nullable=True)  # a, b, c, d, or null if skipped
    is_correct = Column(Boolean, nullable=True)
    time_spent = Column(Integer, nullable=True)  # seconds
    attempt_number = Column(Integer, default=1)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="activities")
    question = relationship("Question", back_populates="activities")


class Mark(Base):
    """User bookmarks/marks for questions"""
    __tablename__ = "marks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Mark details
    mark_type = Column(String(20), default="review")  # review, important, difficult
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="marks")
    question = relationship("Question", back_populates="marks")
