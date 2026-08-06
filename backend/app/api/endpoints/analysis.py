from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Document, AnalysisResult, User
from app.api.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/analysis", tags=["analysis"])

# Request Schema for POST endpoints
class AnalysisRequest(BaseModel):
    document_id: str

# Response Schemas
class SummaryResponse(BaseModel):
    document_id: str
    summary: str

class ClausesResponse(BaseModel):
    document_id: str
    clauses: list

class RisksResponse(BaseModel):
    document_id: str
    risk_score: int
    key_risks: dict

class AnalysisDetailsResponse(BaseModel):
    document_id: str
    summary: str
    risk_score: int
    clauses: list
    key_risks: dict


def get_analysis_result(document_id: str, user_id: int, db: Session) -> AnalysisResult:
    """Helper to fetch analysis record and check ownership authorization."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    if doc.status == "processing":
        raise HTTPException(
            status_code=202, 
            detail="Analysis is still in progress. Please check again in a few moments."
        )
    if doc.status == "failed":
        raise HTTPException(status_code=500, detail="Document analysis failed during parsing.")
        
    analysis = db.query(AnalysisResult).filter(AnalysisResult.document_id == document_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis results not found for this document")
    return analysis


# === POST Endpoints (Requested) ===

@router.post("/summary", response_model=SummaryResponse)
def post_summary(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve executive summary of contract using POST request."""
    analysis = get_analysis_result(request.document_id, current_user.id, db)
    return {"document_id": request.document_id, "summary": analysis.summary or ""}


@router.post("/clauses", response_model=ClausesResponse)
def post_clauses(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve extracted contract clauses using POST request."""
    analysis = get_analysis_result(request.document_id, current_user.id, db)
    return {"document_id": request.document_id, "clauses": analysis.clauses or []}


@router.post("/risks", response_model=RisksResponse)
def post_risks(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve contract risk scores and categories using POST request."""
    analysis = get_analysis_result(request.document_id, current_user.id, db)
    return {
        "document_id": request.document_id,
        "risk_score": analysis.risk_score,
        "key_risks": analysis.key_risks or {"high": [], "medium": [], "low": []}
    }


# === GET Endpoints (For backwards compatibility and detailed views) ===

@router.get("/summary", response_model=SummaryResponse)
def get_summary_query(
    document_id: str = Query(..., description="The ID of the document"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve executive summary using query parameters."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {"document_id": document_id, "summary": analysis.summary or ""}


@router.get("/summary/{document_id}", response_model=SummaryResponse)
def get_summary_path(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve executive summary using path parameters."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {"document_id": document_id, "summary": analysis.summary or ""}


@router.get("/clauses", response_model=ClausesResponse)
def get_clauses_query(
    document_id: str = Query(..., description="The ID of the document"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of highlighted legal clauses with risk tags using query parameters."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {"document_id": document_id, "clauses": analysis.clauses or []}


@router.get("/clauses/{document_id}", response_model=ClausesResponse)
def get_clauses_path(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of highlighted legal clauses with risk tags using path parameters."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {"document_id": document_id, "clauses": analysis.clauses or []}


@router.get("/risks", response_model=RisksResponse)
def get_risks_query(
    document_id: str = Query(..., description="The ID of the document"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve contract risk scores and categories using query parameters."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {
        "document_id": document_id,
        "risk_score": analysis.risk_score,
        "key_risks": analysis.key_risks or {"high": [], "medium": [], "low": []}
    }


@router.get("/risks/{document_id}", response_model=RisksResponse)
def get_risks_path(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve contract risk scores and categories using path parameters."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {
        "document_id": document_id,
        "risk_score": analysis.risk_score,
        "key_risks": analysis.key_risks or {"high": [], "medium": [], "low": []}
    }


@router.get("/details/{document_id}", response_model=AnalysisDetailsResponse)
def get_analysis_details(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregated analysis details endpoint, optimal for single-page dashboard rendering."""
    analysis = get_analysis_result(document_id, current_user.id, db)
    return {
        "document_id": document_id,
        "summary": analysis.summary or "",
        "risk_score": analysis.risk_score or 0,
        "clauses": analysis.clauses or [],
        "key_risks": analysis.key_risks or {"high": [], "medium": [], "low": []}
    }
