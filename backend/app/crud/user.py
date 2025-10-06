"""
CRUD operations for User model
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.models import User
from app.schemas.schemas import UserCreate
from app.core.security import get_password_hash, verify_password
from typing import Optional


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username/email and password"""
    # Allow login with either username or email
    user = db.query(User).filter(
        or_(User.username == username, User.email == username)
    ).first()
    
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def update_user_activity(db: Session, user_id: int):
    """Update user's last activity timestamp"""
    user = get_user_by_id(db, user_id)
    if user:
        db.commit()
        db.refresh(user)