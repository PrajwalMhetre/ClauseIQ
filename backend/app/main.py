from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
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
# Support localhost:5173 for Vite dev frontend server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database with base models and admin account on startup
@app.on_event("startup")
def on_startup():
    # 1. Create SQLite or PostgreSQL tables if not present
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed Administrator account from environment variables
    db = SessionLocal()
    try:
        admin_email = settings.ADMIN_EMAIL
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            hashed_pwd = security.get_password_hash(settings.ADMIN_PASSWORD)
            new_admin = User(
                email=admin_email,
                hashed_password=hashed_pwd,
                full_name="System Administrator",
                is_active=True,
                is_admin=True
            )
            db.add(new_admin)
            db.commit()
            print(f"Database seeded: created default administrator account ({admin_email})")
    except Exception as e:
        print(f"Error seeding administrator account: {str(e)}")
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
