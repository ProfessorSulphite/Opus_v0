#!/usr/bin/env python3
"""
Simple MCQ Import Script for EduTheo
Imports JSON MCQ data into SQLite database
"""

import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

# Add SQLAlchemy imports
try:
    from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, Boolean
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker
except ImportError:
    print("Error: SQLAlchemy not installed. Run: pip install sqlalchemy")
    sys.exit(1)

# Create database models
Base = declarative_base()

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(String(50), nullable=False, unique=True, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # {"a": "...", "b": "...", "c": "...", "d": "..."}
    correct_answer = Column(String(1), nullable=False)
    explanations = Column(JSON)
    hints = Column(JSON)
    chapter_name = Column(String(100), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    difficulty_level = Column(String(20), nullable=False)
    question_type = Column(String(30))
    source = Column(String(100))
    language = Column(String(10))
    grade = Column(String(10))
    subject = Column(String(20))
    tags = Column(JSON)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime)
    is_active = Column(Boolean, default=True)


def create_database(database_url):
    """Create database and tables"""
    # Ensure database directory exists
    if database_url.startswith('sqlite:///'):
        db_path = database_url.replace('sqlite:///', '')
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
    
    # Create engine and tables
    engine = create_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine


def import_questions(json_file_path, database_url):
    """Import questions from JSON file to database"""
    
    # Create database
    engine = create_database(database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    # Load JSON data
    print(f"Loading JSON data from: {json_file_path}")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    
    print(f"Found {len(questions_data)} questions to import")
    
    # Import statistics
    stats = {
        'total': len(questions_data),
        'imported': 0,
        'skipped': 0,
        'errors': []
    }
    
    # Process each question
    for i, question_data in enumerate(questions_data, 1):
        try:
            # Extract data from your JSON structure
            question_text = question_data.get('question', '')
            options_dict = question_data.get('options', {})
            answer = question_data.get('answer', '')
            explanations = question_data.get('explanations', {})
            metadata = question_data.get('metadata', {})
            
            # Validate required fields
            if not question_text or not options_dict or not answer:
                print(f"Skipping question {i}: Missing required fields")
                stats['skipped'] += 1
                continue
            
            # Convert options dict to list format for database storage
            options_list = [
                options_dict.get('a', ''),
                options_dict.get('b', ''),
                options_dict.get('c', ''),
                options_dict.get('d', '')
            ]
            
            # Map answer letter to index (a=0, b=1, c=2, d=3)
            answer_mapping = {'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D'}
            correct_answer = answer_mapping.get(answer.lower(), answer.upper())
            
            # Get explanation for correct answer
            explanation_text = explanations.get(answer, '') if explanations else ''
            
            # Extract metadata
            chapter = metadata.get('chapter_name', 'Unknown Chapter')
            difficulty = metadata.get('difficulty_level', 'Medium')
            source = metadata.get('source', 'Physics Textbook')
            tags = metadata.get('tags', [])
            
            # Check if question already exists  
            existing = db.query(Question).filter(
                Question.question_text == question_text
            ).first()
            
            if existing:
                print(f"Question {i} already exists, skipping...")
                stats['skipped'] += 1
                continue
            
            # Generate unique question_id
            question_id = f"q_{i:03d}"
            
            # Extract chapter number from metadata
            chapter_number = metadata.get('chapter_number', 1)
            if isinstance(chapter_number, str):
                try:
                    chapter_number = int(chapter_number)
                except:
                    chapter_number = 1
            
            # Create new question
            new_question = Question(
                question_id=question_id,
                question_text=question_text,
                options=options_dict,  # Store as dict as in JSON
                correct_answer=correct_answer,
                explanations=explanations,
                chapter_name=chapter,
                chapter_number=chapter_number,
                difficulty_level=difficulty,
                source=source,
                language="en",
                grade="9",
                subject="Physics",
                tags=tags,
                question_type="MCQ",
                is_active=True
            )
            
            # Add to database
            db.add(new_question)
            db.commit()
            
            stats['imported'] += 1
            print(f"✓ Imported question {i}/{len(questions_data)}")
            
        except Exception as e:
            print(f"✗ Error importing question {i}: {str(e)}")
            stats['errors'].append(f"Question {i}: {str(e)}")
            stats['skipped'] += 1
            db.rollback()
            continue
    
    # Close database connection
    db.close()
    
    # Print summary
    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    print(f"Total questions: {stats['total']}")
    print(f"Successfully imported: {stats['imported']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Errors: {len(stats['errors'])}")
    print(f"Success rate: {(stats['imported']/stats['total']*100):.1f}%")
    
    if stats['errors']:
        print(f"\nFirst 5 errors:")
        for error in stats['errors'][:5]:
            print(f"  - {error}")
    
    print(f"\nDatabase file created at: {database_url}")
    return stats


def main():
    parser = argparse.ArgumentParser(description="Import MCQ questions from JSON to SQLite")
    parser.add_argument("--json-file", required=True, help="Path to JSON file with questions")
    parser.add_argument("--database-url", default="sqlite:///./edutheo.db", 
                       help="Database URL (default: sqlite:///./edutheo.db)")
    
    args = parser.parse_args()
    
    # Validate JSON file
    if not os.path.exists(args.json_file):
        print(f"Error: JSON file not found: {args.json_file}")
        sys.exit(1)
    
    # Import questions
    try:
        stats = import_questions(args.json_file, args.database_url)
        
        if stats['imported'] > 0:
            print(f"\n🎉 Import completed! {stats['imported']} questions imported successfully.")
        else:
            print(f"\n⚠️  No questions were imported. Check the errors above.")
            
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()