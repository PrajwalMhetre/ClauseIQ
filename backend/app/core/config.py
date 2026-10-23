import os
from pathlib import Path
try:
    from dotenv import load_dotenv
except ImportError:  # Lets configuration validation run before optional local tooling is installed.
    load_dotenv = lambda *_args, **_kwargs: False

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    PROJECT_NAME = "ClauseIQ"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
    SECRET_KEY = os.getenv("SECRET_KEY", "")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./clauseiq.db")
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploaded_documents"))
    CHROMA_DB_DIR = Path(os.getenv("CHROMA_DB_DIR", "./chroma_db"))
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    AI_MODE = os.getenv("AI_MODE", "provider").lower()
    MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(15 * 1024 * 1024)))
    MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "200"))
    PASSWORD_RESET_TTL_MINUTES = int(os.getenv("PASSWORD_RESET_TTL_MINUTES", "30"))
    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "disabled").lower()
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "")
    RESET_URL_BASE = os.getenv("RESET_URL_BASE", "http://localhost:5173/reset-password")
    ADMIN_BOOTSTRAP_EMAIL = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "")
    ADMIN_BOOTSTRAP_PASSWORD = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "")
    CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]

    def __init__(self):
        if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.startswith("generate-") or self.SECRET_KEY.startswith("replace-"):
            raise RuntimeError("SECRET_KEY must be a unique 32+ character environment value")
        if self.ENVIRONMENT == "production" and self.AI_MODE == "mock":
            raise RuntimeError("AI_MODE=mock is not allowed in production")
        if self.ENVIRONMENT == "production" and self.EMAIL_PROVIDER == "smtp" and not all((self.SMTP_HOST, self.SMTP_FROM)):
            raise RuntimeError("SMTP_HOST and SMTP_FROM are required when EMAIL_PROVIDER=smtp")
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
