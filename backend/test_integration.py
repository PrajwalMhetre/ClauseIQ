import sys
import time
import json
import urllib.request
import urllib.parse
from pathlib import Path

# API Base URL
BASE_URL = "http://127.0.0.1:8000/api"
PDF_FILE = Path(__file__).resolve().parent / "sample_contract.pdf"

def make_request(url, method="GET", data=None, headers=None, is_file=False, file_name=None, file_bytes=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if is_file and file_bytes:
        # Construct raw multipart/form-data payload for file upload
        boundary = b"----WebKitFormBoundaryClauseIQIntegrationTest"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary.decode()}"
        
        part_header = (
            b"--" + boundary + b"\r\n"
            b'Content-Disposition: form-data; name="file"; filename="' + file_name.encode() + b'"\r\n'
            b"Content-Type: application/pdf\r\n\r\n"
        )
        part_footer = b"\r\n--" + boundary + b"--\r\n"
        req_data = part_header + file_bytes + part_footer
    elif data:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            resp_body = response.read().decode("utf-8")
            return status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        status = e.code
        resp_body = e.read().decode("utf-8")
        try:
            body_json = json.loads(resp_body)
        except Exception:
            body_json = resp_body
        return status, body_json
    except Exception as e:
        return 500, {"detail": str(e)}

def run_integration_test():
    print("=== ClauseIQ API Full-Stack Integration Test (urllib) ===")
    
    # Generate unique test user email
    timestamp = int(time.time())
    email = f"testuser_{timestamp}@example.com"
    password = "SecurePassword123!"
    full_name = "Jane Integration Doe"
    
    # 1. Register User
    print(f"\n1. Registering user: {email}...")
    register_payload = {
        "email": email,
        "password": password,
        "full_name": full_name
    }
    status, res = make_request(f"{BASE_URL}/auth/register", method="POST", data=register_payload)
    if status != 201:
        print(f"✗ Registration failed ({status}): {res}")
        sys.exit(1)
    print("✓ Registration successful.")
    
    # 2. Login User
    print("\n2. Logging in to acquire JWT token...")
    login_payload = {
        "email": email,
        "password": password
    }
    status, res = make_request(f"{BASE_URL}/auth/login", method="POST", data=login_payload)
    if status != 200:
        print(f"✗ Login failed ({status}): {res}")
        sys.exit(1)
    
    token = res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful. JWT token received.")
    
    # 3. Upload Document
    print(f"\n3. Uploading contract PDF: {PDF_FILE.name}...")
    if not PDF_FILE.exists():
        print(f"✗ Mock contract file not found: {PDF_FILE}")
        sys.exit(1)
        
    with open(PDF_FILE, "rb") as f:
        file_bytes = f.read()
        
    status, res = make_request(
        f"{BASE_URL}/documents/upload", 
        method="POST", 
        headers=headers,
        is_file=True,
        file_name=PDF_FILE.name,
        file_bytes=file_bytes
    )
        
    if status not in (200, 202):
        print(f"✗ Document upload failed ({status}): {res}")
        sys.exit(1)
        
    doc_id = res["id"]
    print(f"✓ Upload successful. Document ID: {doc_id}. Status: {res['status']}")
    
    # 4. Poll Document Status
    print("\n4. Polling analysis status...")
    max_retries = 10
    retry_interval = 1.5
    completed = False
    
    for i in range(max_retries):
        status, res = make_request(f"{BASE_URL}/documents/{doc_id}", headers=headers)
        if status != 200:
            print(f"✗ Failed to get document status: {res}")
            sys.exit(1)
            
        doc_status = res["status"]
        print(f"   [Retry {i+1}] Ingestion status: {doc_status}")
        
        if doc_status == "completed":
            completed = True
            break
        elif doc_status == "failed":
            print("✗ Document analysis failed.")
            sys.exit(1)
            
        time.sleep(retry_interval)
        
    if not completed:
        print("✗ Document processing timed out.")
        sys.exit(1)
    print("✓ Document successfully ingested and analyzed.")
    
    # 5. Fetch Analysis Details
    print("\n5. Retrieving risk score and clauses audit...")
    status, res = make_request(f"{BASE_URL}/analysis/details/{doc_id}", headers=headers)
    if status != 200:
        print(f"✗ Failed to fetch analysis details: {res}")
        sys.exit(1)
        
    print("✓ Analysis loaded.")
    print(f"   - Overall Risk Score: {res['risk_score']}/100")
    print(f"   - Summary: {res['summary'][:120]}...")
    print(f"   - Extracted Clauses Count: {len(res['clauses'])}")
    
    # 6. Query Chat Bot
    question = "What is the limitation of liability cap?"
    print(f"\n6. Conversing with document: '{question}'...")
    chat_payload = {
        "document_id": doc_id,
        "question": question
    }
    status, res = make_request(f"{BASE_URL}/chat/query", method="POST", data=chat_payload, headers=headers)
    if status != 200:
        print(f"✗ Chat Q&A failed ({status}): {res}")
        sys.exit(1)
        
    print("✓ Chat response received.")
    print(f"   - AI Answer: {res['answer']}")
    print(f"   - Citations Pages: {[s['page'] for s in res['sources']]}")
    
    # 7. Check Chat History
    print("\n7. Retrieving dialogue history...")
    status, res = make_request(f"{BASE_URL}/chat/history/{doc_id}", headers=headers)
    if status != 200:
        print(f"✗ Failed to fetch chat history: {res}")
        sys.exit(1)
        
    print(f"✓ Chat history loaded. Total dialogue messages: {len(res) * 2}")
    
    print("\n=== All Integration Tests Completed Successfully! ===")

if __name__ == "__main__":
    run_integration_test()
