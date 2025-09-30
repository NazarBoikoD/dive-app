import os
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User
from app.services.auth import get_password_hash

# Database connection (use the same URL as in docker-compose)
SQLALCHEMY_DATABASE_URL = "postgresql://diver:diving123@db:5432/diving_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_user():
    db = SessionLocal()
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("Test user already exists")
            return

        # Create test user
        test_user = User(
            username="testuser",
            hashed_password=get_password_hash("password123"),
            email="test@example.com"
        )
        db.add(test_user)
        db.commit()
        print("Test user created successfully")
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 