import os
import re
import json
import hashlib
import urllib.request
from typing import List, Dict, Any
from app.core.config import settings

# Attempt to load LangChain splitter
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
except Exception:
    SPLITTER = None

class ChromaService:
    _chroma_client = None
    _has_chromadb = True

    @classmethod
    def _get_client(cls):
        """Lazy initialization of ChromaDB. Fallback to sidecar search if unavailable."""
        if not cls._has_chromadb:
            return None
            
        if cls._chroma_client is None:
            try:
                import chromadb
                # Ensure chroma directory exists
                settings.CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)
                cls._chroma_client = chromadb.PersistentClient(path=str(settings.CHROMA_DB_DIR))
            except ImportError:
                print("ChromaDB library is not installed. Using local JSON sidecar index fallback.")
                cls._has_chromadb = False
                return None
            except Exception as e:
                print(f"Failed to initialize ChromaDB Persistent Client: {str(e)}. Using sidecar index fallback.")
                cls._has_chromadb = False
                return None
        return cls._chroma_client

    @classmethod
    def _get_collection(cls, document_id: str):
        """Retrieve or create a collection unique to a document."""
        client = cls._get_client()
        if client is None:
            return None
            
        # ChromaDB collection names must be 3-63 characters, start/end alphanumeric, no double periods
        safe_id = f"doc_{re.sub(r'[^a-zA-Z0-9_-]', '', document_id)}"[:60]
        try:
            return client.get_collection(name=safe_id)
        except Exception:
            try:
                return client.create_collection(name=safe_id)
            except Exception:
                return None

    @classmethod
    def _split_text(cls, text: str) -> List[str]:
        """Split text using RecursiveCharacterTextSplitter or manual overlap fallback."""
        if SPLITTER is not None:
            try:
                return SPLITTER.split_text(text)
            except Exception:
                pass
                
        # Manual fallback overlap chunker
        words = text.split()
        chunks = []
        current_chunk = []
        current_len = 0
        for w in words:
            current_chunk.append(w)
            current_len += len(w) + 1
            if current_len >= 1000:
                chunks.append(" ".join(current_chunk))
                # 200 overlap is about 30 words
                current_chunk = current_chunk[-30:]
                current_len = sum(len(x) + 1 for x in current_chunk)
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    @classmethod
    def _generate_embedding_individual(cls, text: str) -> List[float]:
        """Generate single vector. Fallback chain: OpenAI -> Gemini -> Hash."""
        # 1. Try OpenAI
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.embeddings.create(
                    input=[text],
                    model="text-embedding-3-small"
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"OpenAI single embedding warning: {e}")

        # 2. Try Gemini
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "model": "models/text-embedding-004",
                    "content": {
                        "parts": [{"text": text}]
                    }
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req) as res:
                    res_data = json.loads(res.read().decode())
                    return res_data["embedding"]["values"]
            except Exception as e:
                print(f"Gemini single embedding warning: {e}")

        # 3. Deterministic fallback hash vector (size 1536)
        h = hashlib.sha256(text.encode("utf-8")).hexdigest()
        vec = []
        for i in range(1536):
            idx = (i * 2) % 60
            val = int(h[idx:idx+2], 16) / 255.0
            vec.append(val)
        return vec

    @classmethod
    def _generate_embeddings_batch(cls, texts: List[str]) -> List[List[float]]:
        """Generate batch vectors. Fallback chain: OpenAI -> Individual."""
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.embeddings.create(
                    input=texts,
                    model="text-embedding-3-small"
                )
                return [data.embedding for data in response.data]
            except Exception as e:
                print(f"OpenAI batch embedding warning: {e}. Trying individual fallback.")

        # Falls back to individual calls (which handle Gemini or Hashing internally)
        embeddings = []
        for t in texts:
            embeddings.append(cls._generate_embedding_individual(t))
        return embeddings

    @classmethod
    def index_document(cls, document_id: str, pages: List[Dict[str, Any]], filename: str = "document.pdf"):
        """Ingest document page-by-page, chunk, embed, and store in ChromaDB."""
        chunks = []
        
        # 1. Chunk page by page to preserve exact page associations
        for page in pages:
            page_num = page["page_number"]
            text = page["text"].strip()
            if not text:
                continue
                
            page_chunks = cls._split_text(text)
            for idx, chunk_text in enumerate(page_chunks):
                chunks.append({
                    "id": f"{document_id}_p{page_num}_c{idx}",
                    "text": chunk_text,
                    "page_number": page_num
                })

        if not chunks:
            # Fallback if empty PDF content
            chunks.append({
                "id": f"{document_id}_empty",
                "text": "This contract page contains empty text.",
                "page_number": 1
            })

        # Save sidecar JSON layout
        doc_dir = settings.UPLOAD_DIR / document_id
        doc_dir.mkdir(parents=True, exist_ok=True)
        chunks_file = doc_dir / "chunks.json"
        with open(chunks_file, "w", encoding="utf-8") as f:
            json.dump(chunks, f, indent=2)

        # 2. Add to ChromaDB persistent collection
        client = cls._get_client()
        if client is not None:
            try:
                collection = cls._get_collection(document_id)
                if collection is not None:
                    ids = [c["id"] for c in chunks]
                    documents = [c["text"] for c in chunks]
                    
                    # Store exact requested metadata structure
                    metadatas = [{
                        "document_id": document_id,
                        "page_number": c["page_number"],
                        "source_file": filename
                    } for c in chunks]

                    # Generate embeddings
                    embeddings = cls._generate_embeddings_batch(documents)

                    # Batch write
                    for i in range(0, len(chunks), 100):
                        collection.add(
                            ids=ids[i:i+100],
                            documents=documents[i:i+100],
                            metadatas=metadatas[i:i+100],
                            embeddings=embeddings[i:i+100]
                        )
                    print(f"✓ Ingested document index in ChromaDB. Collections: {len(chunks)} chunks.")
                    return
            except Exception as e:
                print(f"ChromaDB write warning: {str(e)}. Fallback sidecar activated.")

    @classmethod
    def query_document(cls, document_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks from ChromaDB or JSON sidecars. Top K = 5."""
        client = cls._get_client()
        if client is not None:
            try:
                collection = cls._get_collection(document_id)
                if collection is not None:
                    # Generate query vector
                    query_vector = cls._generate_embedding_individual(query)
                    
                    results = collection.query(
                        query_embeddings=[query_vector],
                        n_results=limit
                    )
                    
                    retrieved = []
                    if results and "documents" in results and results["documents"]:
                        documents = results["documents"][0]
                        metadatas = results["metadatas"][0] if "metadatas" in results else []
                        
                        for idx, doc_text in enumerate(documents):
                            page_num = 1
                            if idx < len(metadatas) and metadatas[idx]:
                                page_num = metadatas[idx].get("page_number", 1)
                            retrieved.append({
                                "text": doc_text,
                                "page_number": page_num
                            })
                    return retrieved
            except Exception as e:
                print(f"ChromaDB query warning: {str(e)}. Fetching local fallback sidecars.")

        # Local search: keyword counts from sidecar
        chunks_file = settings.UPLOAD_DIR / document_id / "chunks.json"
        if not chunks_file.exists():
            return []

        with open(chunks_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        query_words = [w.lower() for w in re.split(r'\W+', query) if w.strip()]
        scored_chunks = []
        for c in chunks:
            text_lower = c["text"].lower()
            score = 0
            for qw in query_words:
                score += text_lower.count(qw)
            scored_chunks.append((score, c))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_hits = [item[1] for item in scored_chunks[:limit]]
        return [{"text": th["text"], "page_number": th["page_number"]} for th in top_hits]

    @classmethod
    def delete_document_index(cls, document_id: str):
        """Remove collection index and sidecar files."""
        if cls._get_client() is not None:
            try:
                client = cls._get_client()
                safe_id = f"doc_{re.sub(r'[^a-zA-Z0-9_-]', '', document_id)}"[:60]
                client.delete_collection(name=safe_id)
            except Exception:
                pass
        
        chunks_file = settings.UPLOAD_DIR / document_id / "chunks.json"
        if chunks_file.exists():
            try:
                os.remove(chunks_file)
            except Exception:
                pass
