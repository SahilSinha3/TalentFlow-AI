import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OutreachAI Backend"
    MONGODB_URL: str = os.getenv(
        "MONGODB_URL",
        "mongodb+srv://vaishnavisingh0108_db_user:7mziE6HviYXSAQxP@cluster0.ryd77md.mongodb.net/?retryWrites=true&w=majority"
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "outreach_ai")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "outreach-ai-super-secret-jwt-key-2026-xyz")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    class Config:
        env_file = ".env"

settings = Settings()
