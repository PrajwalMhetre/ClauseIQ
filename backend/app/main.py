from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from sqlalchemy import inspect, text
from app.db.models import User
from app.core import security
from app.api.endpoints import auth, documents, analysis, chat, admin

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ClauseIQ AI legal intelligence platform backend",
    version="1.0.0"
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Lightweight additive migration for existing installations without Alembic.
    if "session_version" not in {column["name"] for column in inspect(engine).get_columns("users")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0"))
    # Safe, opt-in bootstrap: production cannot silently get a known admin account.
    if not (settings.ADMIN_BOOTSTRAP_EMAIL and settings.ADMIN_BOOTSTRAP_PASSWORD):
        return
    if len(settings.ADMIN_BOOTSTRAP_PASSWORD) < 12:
        raise RuntimeError("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters")
    db = SessionLocal()
    try:
        admin_email = security.normalize_email(settings.ADMIN_BOOTSTRAP_EMAIL)
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            new_admin = User(
                email=admin_email,
                hashed_password=security.get_password_hash(settings.ADMIN_BOOTSTRAP_PASSWORD),
                full_name="System Administrator",
                is_active=True,
                is_admin=True
            )
            db.add(new_admin)
            db.commit()
            print(f"Administrator bootstrap completed for {admin_email}")
    finally:
        db.close()

# Register API Endpoint Routers
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    """Welcome endpoint for verification of running state."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "message": "Welcome to the ClauseIQ AI Legal Document Intelligence API!"
    }
