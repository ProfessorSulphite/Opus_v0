"""
Configuration settings for EduTheo application
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database - Use absolute path to ensure it works from any directory
    database_url: str = "sqlite:////home/ufuq_kamal/Opus/Opus_v0/backend/data/edutheo.db"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: list = ["http://localhost:3000", "http://localhost:8080", "http://localhost:5173"]
    
    # Logging
    log_level: str = "INFO"
    
    # Environment
    environment: str = "development"
    
    # Import data source
    source_mcq_file: str = "../raw_data/9th_physics_mcqs.json"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()