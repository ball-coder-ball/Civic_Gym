from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
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

# Explicitly use a zero-cost, Thai-compatible multilingual embedding model
hf_embedding_function = SentenceTransformerEmbeddingFunction(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

collection = chroma_client.get_or_create_collection(
    name="civic_documents", 
    embedding_function=hf_embedding_function
)

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


# ──────────────────────────────────────────────────────────────
# Module 1: The Sparring Zone  (Real AI Debate + Evaluation)
# Reference: csv610/AIDebator, ucl-dark/llm_debate patterns
# ──────────────────────────────────────────────────────────────

class MessageItem(BaseModel):
    role: str          # "user" | "assistant"
    content: str

class DebateRequest(BaseModel):
    messages: List[MessageItem]       # full conversation history so far
    userMessage: str                  # the new message from the user

class EvaluateRequest(BaseModel):
    messages: List[MessageItem]       # full 5-turn conversation


DEBATE_SYSTEM_PROMPT = """คุณคือ AI คู่โต้วาทีในแพลตฟอร์ม "Civic Gym" ภาษาไทย
บทบาทของคุณ:
- ท้าทายข้อโต้แย้งของผู้ใช้อย่างมีเหตุผล
- ชี้ให้เห็นจุดอ่อนในตรรกะ ขาดหลักฐาน หรือความคลุมเครือ
- ใช้วิธีโสกราตีสในการตั้งคำถามกลับ
- ตอบเป็นภาษาไทยเสมอ กระชับ ไม่เกิน 3 ประโยค
- ห้ามใช้ภาษาหยาบคายหรือดูถูก
- ถ้าผู้ใช้พิมพ์คำที่ไม่เกี่ยวข้อง (เช่น "Hello" ซ้ำๆ) ให้ตอบว่าไม่เข้าใจข้อโต้แย้งและขอให้เสนอประเด็นที่ชัดเจน"""

EVALUATE_SYSTEM_PROMPT = """คุณคือผู้ตัดสินการโต้วาที AI ที่เป็นกลาง
วิเคราะห์ประสิทธิภาพของผู้ใช้ (role: "user") จากบทสนทนาทั้งหมด
ให้คะแนน 0-100 ใน 5 ด้าน:

1. Logic (ตรรกะ): ข้อโต้แย้งมีเหตุผลหรือไม่? มีความผิดพลาดทางตรรกะหรือไม่?
2. Evidence (หลักฐาน): มีการอ้างอิงข้อมูล ตัวเลข หรือตัวอย่างที่เป็นรูปธรรมหรือไม่?
3. Persuasion (การโน้มน้าว): วาทศิลป์มีพลังแค่ไหน? สามารถโน้มน้าวผู้ฟังได้หรือไม่?
4. Openness (การเปิดรับ): ผู้ใช้ยอมรับจุดอ่อนของตัวเองหรือพิจารณามุมมองตรงข้ามหรือไม่?
5. Clarity (ความชัดเจน): ข้อโต้แย้งชัดเจน เข้าใจง่ายหรือไม่?

สำคัญ: ถ้าผู้ใช้พิมพ์คำซ้ำๆ ที่ไม่มีสาระ (เช่น "Hello" หรือ "สวัสดี" ซ้ำๆ) ให้คะแนนต่ำมาก (0-10) ในทุกด้าน

คืนค่าเป็น JSON เท่านั้น ในรูปแบบนี้:
{"logic": 0, "evidence": 0, "persuasion": 0, "openness": 0, "clarity": 0, "feedback": "ข้อเสนอแนะภาษาไทยสั้นๆ"}"""


@app.post("/api/module1/debate")
async def debate_turn(request: DebateRequest):
    """
    Module 1 Sparring: Send the conversation + new user message to DeepSeek.
    Returns a contextual Thai counter-argument.
    """
    # Build the messages array for DeepSeek
    deepseek_messages = [
        {"role": "system", "content": DEBATE_SYSTEM_PROMPT}
    ]

    # Add conversation history
    for msg in request.messages:
        deepseek_messages.append({"role": msg.role, "content": msg.content})

    # Add the new user message
    deepseek_messages.append({"role": "user", "content": request.userMessage})

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": deepseek_messages,
        "temperature": 0.7,
        "max_tokens": 300
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DeepSeek API Error: {str(e)}")

    data = response.json()
    raw_content = data['choices'][0]['message']['content']
    ai_response = strip_think_tags(raw_content)

    return {"response": ai_response}


@app.post("/api/module1/evaluate")
async def evaluate_debate(request: EvaluateRequest):
    """
    Module 1 Evaluation: After 5 turns, send the full conversation
    to DeepSeek for structured scoring across 5 axes.
    Returns JSON scores (0-100) for radar chart display.
    """
    # Build conversation transcript for the evaluator
    transcript = ""
    for msg in request.messages:
        label = "ผู้ใช้" if msg.role == "user" else "AI"
        transcript += f"[{label}]: {msg.content}\n"

    deepseek_messages = [
        {"role": "system", "content": EVALUATE_SYSTEM_PROMPT},
        {"role": "user", "content": f"บทสนทนาที่ต้องประเมิน:\n\n{transcript}\n\nกรุณาประเมินและคืนค่า JSON"}
    ]

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": deepseek_messages,
        "temperature": 0.3,
        "max_tokens": 500
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DeepSeek Evaluation Error: {str(e)}")

    data = response.json()
    raw_content = data['choices'][0]['message']['content']
    json_str = strip_think_tags(raw_content)

    # Cleanup markdown JSON blocks
    if json_str.startswith("```json"):
        json_str = json_str[7:-3].strip()
    elif json_str.startswith("```"):
        json_str = json_str[3:-3].strip()

    try:
        scores = json.loads(json_str)
        return {"scores": scores}
    except json.JSONDecodeError:
        # Fallback: return zeros if parsing fails
        return {
            "scores": {
                "logic": 0, "evidence": 0, "persuasion": 0,
                "openness": 0, "clarity": 0,
                "feedback": "ไม่สามารถประเมินได้ กรุณาลองใหม่"
            },
            "raw_output": json_str
        }
