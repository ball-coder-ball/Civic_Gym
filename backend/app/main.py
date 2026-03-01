from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import chromadb
from fastapi.middleware.cors import CORSMiddleware
import httpx
import json
import os
from .utils.llm_parser import strip_think_tags

app = FastAPI(title="Civic Gym Backend API")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update with Vercel frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB for RAG (Persistent to avoid costs)
# Running persistently on instance disk
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'chroma_data')
os.makedirs(CHROMA_DB_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
collection = chroma_client.get_or_create_collection(name="civic_documents")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-f90c54a9e2d34a999ec676b3befbe7d7")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

class StatementRequest(BaseModel):
    statement: str

class IngestRequest(BaseModel):
    text: str
    metadata: Dict[str, Any]

# Module 2: The Detective Zone (Fact & Fallacy Checker with RAG)
@app.post("/api/module2/analyze")
async def analyze_statement(request: StatementRequest):
    statement = request.statement
    
    # 1. Retrieve relevant context from ChromaDB
    # In practice, use sentence-transformers to encode 'statement' or Chroma's default embedding func
    # Here we assume ChromaDB is using its default embedding function for the query.
    results = collection.query(
        query_texts=[statement],
        n_results=3
    )
    
    context_docs = results['documents'][0] if results['documents'] else []
    contextual_info = "\n".join(context_docs)
    
    # 2. Call DeepSeek R1 API
    system_prompt = (
        "You are an impartial logic instructor. Do not judge political stances. "
        "Point out logical fallacies and encourage critical thinking using the Socratic method. "
        "Never use toxic language."
    )
    
    user_prompt = f"""
    Context for fact-checking:
    {contextual_info}
    
    User Statement: "{statement}"
    
    Identify if the text contains hate speech, opinion, or fact based on the context.
    Return ONLY a JSON array highlighting text segments exactly in this format:
    [{{ "text": "exact words", "type": "hate_speech" | "opinion" | "fact", "reason": "why" }}]
    Do not add extra markdown formatting around the JSON if possible.
    """
    
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-reasoner",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DeepSeek API Error: {str(e)}")
            
    data = response.json()
    raw_content = data['choices'][0]['message']['content']
    
    # 3. Process with llm_parser to reliably strip <think> blocks
    json_str = strip_think_tags(raw_content)
    
    # Cleanup markdown JSON blocks (if the LLM output them despite instructions)
    if json_str.startswith("```json"):
        json_str = json_str[7:-3].strip()
    elif json_str.startswith("```"):
        json_str = json_str[3:-3].strip()
        
    try:
        parsed_result = json.loads(json_str)
        return {"results": parsed_result}
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON result from DeepSeek", "raw_output": json_str}


@app.post("/api/module2/ingest")
async def ingest_document(request: IngestRequest):
    """
    Endpoint to load pre-selected PDFs/topics into ChromaDB.
    Expected to run locally/admin before deployment to populate the DB.
    """
    doc_id = str(hash(request.text))
    collection.add(
        documents=[request.text],
        metadatas=[request.metadata],
        ids=[doc_id]
    )
    return {"status": "success", "doc_id": doc_id}
