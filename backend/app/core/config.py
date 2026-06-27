import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from .env if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "ClauseIQ"
    
    # Secret Key for JWT auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretjwtkeyclauseiq2026makeitlongandsecure")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Database URL configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./clauseiq.db")
    
    # Storage settings
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "./uploaded_documents"))
    CHROMA_DB_DIR: Path = Path(os.getenv("CHROMA_DB_DIR", "./chroma_db"))
    
    # OpenAI & Gemini Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Admin Credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@clauseiq.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "AdminSecurePassword2026!")

    # CORS — comma-separated list of allowed frontend origins
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    def __init__(self):
        # Create storage directories
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
