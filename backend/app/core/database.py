"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# SQLite configuration with thread safety
connect_args = {"check_same_thread": False}
if "sqlite" in settings.database_url:
    # Enable WAL mode for better concurrency
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.environment == "development"
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database with tables"""
    Base.metadata.create_all(bind=engine)
    
    
def enable_wal_mode():
    """Enable WAL mode for SQLite for better concurrency"""
    if "sqlite" in settings.database_url:
        with engine.connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("PRAGMA cache_size=1000000;")
            conn.execute("PRAGMA temp_store=memory;")
            conn.commit()