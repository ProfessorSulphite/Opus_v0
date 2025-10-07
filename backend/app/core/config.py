"""
Configuration settings for EduTheo application
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent

class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    database_url: str = f"sqlite:///{PROJECT_ROOT / 'backend' / 'data' / 'edutheo.db'}"
    
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

    # AI Configuration
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", "AIzaSyALo0aZdonQIVdzkNcrZYHuv6d0d20B8LE")
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }


settings = Settings()