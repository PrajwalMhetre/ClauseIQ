import sys
import os
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

try:
    from app.core import security
    from app.db.database import Base, engine, SessionLocal
    from app.db.models import User, Document, AnalysisResult
    from app.services.ai_service import AIService
    from app.services.pdf_service import PDFService
    from app.services.chroma_service import ChromaService
    print("✓ Backend modules loaded successfully.")
except ImportError as e:
    print(f"✗ Failed to import backend modules: {str(e)}")
    sys.exit(1)

def test_database():
    print("Testing database table creation...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully.")
    except Exception as e:
        print(f"✗ Database connection failed: {str(e)}")
        sys.exit(1)

def test_security():
    print("Testing security password hashing...")
    pw = "SuperSecret123!"
    h = security.get_password_hash(pw)
    assert security.verify_password(pw, h) is True
    assert security.verify_password("wrong", h) is False
    print("✓ Security hashing functions verified.")

def test_ai_mock_fallback():
    print("Testing AI service fallback mechanism...")
    text_data = [
        {"page_number": 1, "text": "This contract is governed by governing law of Delaware. The Service Provider holds proprietary rights to all patent content."},
        {"page_number": 2, "text": "Limitation of liability is set to one times annual fees. Indemnification rules are unilateral."}
    ]
    res = AIService._get_mock_analysis(text_data, "test_agreement.pdf")
    assert "summary" in res
    assert "clauses" in res
    assert res["risk_score"] > 0
    assert len(res["clauses"]) > 0
    print(f"✓ AI mock engine analysis verified. Score: {res['risk_score']}/100")
    
    # Test chat
    chat_ans = AIService.query_chat("What about indemnity?", text_data, [])
    assert "answer" in chat_ans
    assert len(chat_ans["sources"]) > 0
    print("✓ AI mock engine chat answered correctly.")

if __name__ == "__main__":
    print("=== ClauseIQ Backend Verification Running ===")
    test_database()
    test_security()
    test_ai_mock_fallback()
    print("=== Verification Successful! ===")
