from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import User, Document, AnalysisResult
from app.api.endpoints.auth import get_current_user
import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

# Schemas
class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AdminDocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    status: str
    user_email: str
    created_at: datetime.datetime

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    total_documents: int
    total_storage_bytes: int
    status_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]


def require_admin(current_user: User = Depends(get_current_user)):
    """Security check to guarantee the user has administrative privileges."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return current_user


@router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve list of all users in the system."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.get("/documents", response_model=List[AdminDocumentResponse])
def get_all_documents(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve system-wide document status log."""
    results = db.query(
        Document.id,
        Document.filename,
        Document.file_size,
        Document.status,
        Document.created_at,
        User.email.label("user_email")
    ).join(User, Document.user_id == User.id).order_by(Document.created_at.desc()).all()

    documents = []
    for r in results:
        documents.append({
            "id": r.id,
            "filename": r.filename,
            "file_size": r.file_size or 0,
            "status": r.status,
            "user_email": r.user_email,
            "created_at": r.created_at
        })
    return documents


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_system_analytics(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Calculate and return system usage metadata, sizes, and risk levels distributions."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_storage = db.query(func.sum(Document.file_size)).scalar() or 0

    # Calculate document status distribution
    status_counts = db.query(Document.status, func.count(Document.id)).group_by(Document.status).all()
    status_distribution = {"processing": 0, "completed": 0, "failed": 0}
    for status_name, count in status_counts:
        if status_name in status_distribution:
            status_distribution[status_name] = count

    # Calculate risk score distribution
    analyses = db.query(AnalysisResult.risk_score).all()
    risk_distribution = {"high": 0, "medium": 0, "low": 0}
    for a in analyses:
        score = a.risk_score or 0
        if score >= 70:
            risk_distribution["high"] += 1
        elif score >= 40:
            risk_distribution["medium"] += 1
        else:
            risk_distribution["low"] += 1

    return {
        "total_users": total_users,
        "total_documents": total_documents,
        "total_storage_bytes": total_storage,
        "status_distribution": status_distribution,
        "risk_distribution": risk_distribution
    }
