import os
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User
from app.services.auth import get_password_hash

# Database connection
SQLALCHEMY_DATABASE_URL = "postgresql://diver:diving123@db:5432/diving_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Drop all tables and recreate them
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Create admin user
    db = SessionLocal()
    try:
        # Create admin user
        admin = User(
            username="admin",
            email="admin@divingapp.com",
            hashed_password=get_password_hash("admin123#"),
            name="Admin",
            age=30,
            phone_number="+1234567890",
            is_admin=True
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 