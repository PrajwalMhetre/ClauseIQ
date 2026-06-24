import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Document, AnalysisResult, User
from app.api.endpoints.auth import get_current_user
from app.services.pdf_service import PDFService
from app.services.ai_service import AIService
from app.services.chroma_service import ChromaService
from app.core.config import settings
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/documents", tags=["documents"])

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


def process_document_background(document_id: str, file_path: str, filename: str, db_session_factory):
    """Background pipeline to parse text, build RAG indices, and analyze clauses."""
    # Obtain local db session for background thread
    db = db_session_factory()
    try:
        # 1. Verify and parse text page by page
        pages_content = PDFService.extract_text_by_page(file_path)
        
        # 2. Insert text chunks into vector store (ChromaDB / JSON sidecar)
        ChromaService.index_document(document_id, pages_content)
        
        # 3. Request LLM/Mock analysis (summary, risk scoring, clause extraction)
        analysis_data = AIService.analyze_document(pages_content, filename)
        
        # 4. Save results to Database
        db_analysis = AnalysisResult(
            document_id=document_id,
            summary=analysis_data.get("summary", ""),
            risk_score=analysis_data.get("risk_score", 0),
            clauses=analysis_data.get("clauses", []),
            key_risks=analysis_data.get("key_risks", {"high": [], "medium": [], "low": []})
        )
        db.add(db_analysis)
        
        # Update document status to completed
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "completed"
        db.commit()
        
    except Exception as e:
        print(f"Error processing document {document_id}: {str(e)}")
        # Update document status to failed
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
        db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a contract PDF and trigger async parsing and RAG indexing."""
    # File validation
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF documents are allowed."
        )

    # Limit file uploads to 15MB
    MAX_FILE_SIZE = 15 * 1024 * 1024
    try:
        # Check size by reading a chunk or reading metadata
        file_size = 0
        # Quick validation
        contents = file.file.read()
        file_size = len(contents)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds maximum limit of 15MB."
            )
        # Reset file cursor after reading size
        file.file.seek(0)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read upload file size: {str(e)}"
        )

    # Generate document ID and layout directory
    document_id = str(uuid.uuid4())
    doc_dir = settings.UPLOAD_DIR / document_id
    doc_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = doc_dir / file.filename

    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document file: {str(e)}"
        )

    # Verify PyMuPDF can parse it
    if not PDFService.validate_pdf(str(file_path)):
        # Cleanup file if invalid
        if doc_dir.exists():
            shutil.rmtree(doc_dir)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file or file is corrupted."
        )

    # Create Database Model
    db_doc = Document(
        id=document_id,
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        status="processing"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Pass db session maker to the background thread to create clean connections
    from app.db.database import SessionLocal
    background_tasks.add_task(
        process_document_background,
        document_id,
        str(file_path),
        file.filename,
        SessionLocal
    )

    return db_doc


@router.get("/list", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of all uploaded contract documents for current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return docs


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve single document metadata."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete document files, analysis results, and database references."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Delete Chroma Vector Index
    ChromaService.delete_document_index(document_id)

    # 2. Delete physical storage folder
    doc_dir = settings.UPLOAD_DIR / document_id
    if doc_dir.exists():
        try:
            shutil.rmtree(doc_dir)
        except Exception as e:
            print(f"Error removing document files: {str(e)}")

    # 3. Database deletion (cascades to AnalysisResult and ChatHistory)
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}
