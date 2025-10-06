"""
Data import script to migrate JSON MCQ data to SQLite database
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_dir))

from app.models.models import Base, Question, User
from app.core.security import get_password_hash


class MCQImporter:
    """Import MCQ data from JSON to SQLite database"""

    def __init__(self, database_url: str = None):
        self.database_url = database_url or "sqlite:///./edutheo.db"

        # Ensure database directory exists
        if self.database_url.startswith('sqlite:///'):
            db_path = self.database_url.replace('sqlite:///', '')
            db_dir = os.path.dirname(os.path.abspath(db_path))
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)

        self.engine = create_engine(
            self.database_url,
            connect_args={"check_same_thread": False}
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = SessionLocal()

        # Create tables if they don't exist
        Base.metadata.create_all(bind=self.engine)

        self.import_stats = {
            "total_records": 0,
            "imported_questions": 0,
            "updated_questions": 0,
            "skipped_records": 0,
            "errors": []
        }

    def validate_question_data(self, data: dict) -> bool:
        """Validate question data structure for your JSON format"""
        required_fields = ['question', 'options', 'answer', 'metadata']
        
        for field in required_fields:
            if field not in data or not data[field]:
                self.import_stats["errors"].append(f"Skipping record due to missing required field: {field}")
                return False
        
        if not isinstance(data['options'], dict) or len(data['options']) < 2:
            self.import_stats["errors"].append("Skipping record due to invalid 'options' format")
            return False

        if data['answer'].lower() not in data['options']:
            self.import_stats["errors"].append(f"Skipping record because answer '{data['answer']}' not in options")
            return False

        return True

    def import_question(self, question_data: Dict[str, Any]) -> bool:
        """Import a single question"""
        try:
            # Check if question already exists by its unique question_id from metadata
            existing_question = self.db.query(Question).filter(
                Question.question_id == question_data["question_id"]
            ).first()

            if existing_question:
                # Update existing question
                existing_question.question_text = question_data["question_text"]
                existing_question.options = question_data["options"]
                existing_question.correct_answer = question_data["correct_answer"]
                existing_question.explanations = question_data["explanations"]
                existing_question.hints = question_data["hints"]
                existing_question.chapter_name = question_data["chapter_name"]
                existing_question.chapter_number = question_data["chapter_number"]
                existing_question.difficulty_level = question_data["difficulty_level"]
                existing_question.tags = question_data["tags"]
                existing_question.source = question_data["source"]
                existing_question.updated_date = datetime.utcnow()
                self.import_stats["updated_questions"] += 1
                print(f"Updated question: {question_data['question_id']}...")
            else:
                # Create new question
                new_question = Question(**question_data)
                self.db.add(new_question)
                self.import_stats["imported_questions"] += 1
                print(f"Imported question: {question_data['question_id']}...")

            return True

        except Exception as e:
            error_msg = f"Error importing question {question_data.get('question_id', 'N/A')}: {str(e)}"
            self.import_stats["errors"].append(error_msg)
            print(f"Error: {error_msg}")
            self.db.rollback()
            return False

    def create_demo_user(self):
        """Create a demo user for testing"""
        try:
            demo_user = self.db.query(User).filter(User.username == 'demo').first()
            if not demo_user:
                hashed_password = get_password_hash('demo123')
                user = User(
                    username='demo',
                    email='demo@example.com',
                    hashed_password=hashed_password,
                    full_name='Demo User',
                    is_active=True
                )
                self.db.add(user)
                self.db.commit()
                print("Demo user created successfully.")
            else:
                print("Demo user already exists.")
        except Exception as e:
            print(f"Error creating demo user: {str(e)}")
            self.db.rollback()

    def import_from_json(self, json_file_path: str) -> Dict[str, Any]:
        """Import questions from JSON file"""
        try:
            print(f"Starting import from: {json_file_path}")

            with open(json_file_path, 'r', encoding='utf-8') as file:
                questions_data = json.load(file)

            if not isinstance(questions_data, list):
                raise ValueError("JSON file must contain a list of questions")

            self.import_stats["total_records"] = len(questions_data)
            print(f"Found {len(questions_data)} questions to import")

            for index, q_data in enumerate(questions_data):
                if not self.validate_question_data(q_data):
                    self.import_stats["skipped_records"] += 1
                    continue

                # Prepare data for the Question model
                metadata = q_data.get('metadata', {})
                
                model_data = {
                    "question_id": metadata.get("question_id", f"q_{index + 1:04d}"),
                    "question_text": q_data.get("question"),
                    "options": q_data.get("options"),
                    "correct_answer": q_data.get("answer").upper(),
                    "explanations": q_data.get("explanations", {}),
                    "hints": q_data.get("hints", []),
                    "chapter_name": metadata.get("chapter_name", "Unknown"),
                    "chapter_number": metadata.get("chapter_number", 0),
                    "difficulty_level": metadata.get("difficulty_level", "Medium"),
                    "question_type": metadata.get("question_type", "multiple_choice"),
                    "source": metadata.get("source"),
                    "language": metadata.get("language", "English"),
                    "grade": metadata.get("grade", "9th"),
                    "subject": metadata.get("subject", "Physics"),
                    "tags": metadata.get("tags", []),
                    "is_active": True
                }

                if self.import_question(model_data):
                    if (index + 1) % 50 == 0:
                        self.db.commit()
                        print(f"Processed {index + 1} questions...")
                else:
                    self.import_stats["skipped_records"] += 1

            # Final commit
            self.db.commit()

            # Create demo user
            self.create_demo_user()

            print("Import completed successfully!")
            return self.import_stats

        except Exception as e:
            self.db.rollback()
            self.import_stats["errors"].append(f"Import failed: {str(e)}")
            print(f"Import failed: {str(e)}")
            return self.import_stats

        finally:
            self.db.close()

    def generate_import_report(self, output_path: str = "import_report.json"):
        """Generate import report"""
        report = {
            "import_timestamp": datetime.utcnow().isoformat(),
            "database_url": self.database_url,
            "statistics": self.import_stats,
            "summary": {
                "success_rate": (
                    (self.import_stats["imported_questions"] + self.import_stats["updated_questions"])
                    / self.import_stats["total_records"] * 100
                ) if self.import_stats["total_records"] > 0 else 0
            }
        }

        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump(report, file, indent=2, ensure_ascii=False)

        print(f"Import report saved to: {output_path}")
        return report


def main():
    """Main function to run the import"""
    import argparse

    parser = argparse.ArgumentParser(description="Import MCQ data from JSON to SQLite")
    parser.add_argument("--json-file", default="../raw_data/9th_physics_mcqs.json", help="Path to JSON file containing MCQ data")
    parser.add_argument("--database-url", default="sqlite:///../edutheo.db", help="Database URL")
    parser.add_argument("--report-path", default="../import_report.json", help="Path for import report")

    args = parser.parse_args()

    # Adjust paths to be relative to the script's location
    script_dir = Path(__file__).parent
    json_file = script_dir / args.json_file
    db_url = args.database_url.replace('sqlite:///../', f'sqlite:///{script_dir.parent}/')
    report_path = script_dir / args.report_path


    if not json_file.exists():
        print(f"Error: JSON file not found: {json_file}")
        sys.exit(1)

    print(f"Starting MCQ import from: {json_file}")
    print(f"Database URL: {db_url}")

    importer = MCQImporter(db_url)
    stats = importer.import_from_json(str(json_file))
    report = importer.generate_import_report(str(report_path))

    print("" + "="*50)
    print("IMPORT SUMMARY")
    print("="*50)
    print(f"Total records: {stats['total_records']}")
    print(f"Imported questions: {stats['imported_questions']}")
    print(f"Updated questions: {stats['updated_questions']}")
    print(f"Skipped records: {stats['skipped_records']}")
    print(f"Errors: {len(stats['errors'])}")
    print(f"Success rate: {report['summary']['success_rate']:.2f}%")

    if stats['errors']:
        print("Errors encountered:")
        for error in stats['errors'][:10]:
            print(f"  - {error}")
        if len(stats['errors']) > 10:
            print(f"  ... and {len(stats['errors']) - 10} more errors")

    print(f"Detailed report saved to: {report_path}")


if __name__ == "__main__":
    main()
