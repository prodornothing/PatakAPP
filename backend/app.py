import os
import re
import json
import requests
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Patak - Offline El Niño Response Assistant API",
    description="Local RAG backend for barangay officials and farmers powered by Ollama (qwen2.5:3b + nomic-embed-text) and ChromaDB",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

FALLBACK_RESPONSE = (
    "Pasensya na, wala itong impormasyon sa aking offline database. "
    "Mangyaring sumangguni sa Municipal Agriculture Office (MAO) o sa pinakamalapit na Rural Health Unit (RHU)."
)

SYSTEM_PROMPT_TEMPLATE = f"""You are "Patak", an offline El Niño Response Assistant for Philippine barangay officials, disaster officers (BDRRMC), and farmers.

STRICT INSTRUCTIONS:
1. Answer ONLY using the official advisory excerpts provided under CONTEXT ADVISORIES. Do NOT invent, assume, or extrapolate outside the text.
2. If the context does not contain the answer, reply ONLY with:
   "{FALLBACK_RESPONSE}"
3. EXACT OUTPUT FORMAT:
   - Begin with a single introductory Taglish sentence (e.g. "Narito ang agarang action checklist batay sa mga opisyal na advisory para sa inyong sitwasyon:").
   - Follow with a short numbered ACTION CHECKLIST (3 to 6 practical steps).
   - MANDATORY: Append the exact citation in square brackets [Filename.pdf, Page X] to EVERY SINGLE bullet point without exception!
4. Tone: Empathetic, actionable, respectful Taglish (Tagalog-English conversational mix).
"""

vector_store = "in_memory"
collection = None

try:
    import chromadb
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
    chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    collection = chroma_client.get_or_create_collection(name="elnino_advisories")
    vector_store = "chroma"

    # Auto-seed if empty
    if collection.count() == 0:
        from backend.ingest import seed_database_if_empty
        seed_database_if_empty()
except Exception as e:
    print(f"[PATAK NOTICE] ChromaDB fallback: {e}")

FALLBACK_DOCUMENTS = [
    {
        "id": "da-awd-01",
        "title": "DA Advisory No. 2024-03: Alternate Wetting and Drying (AWD)",
        "source": "DA_AWD_Rice_Protocol_2024.pdf",
        "page": 1,
        "content": "Paggamit ng Observation Well: Magbaon ng 20cm perforated PVC pipe na 10cm ang lalim sa lupa ng palayan. Huwag magpatubig hangga't hindi bumababa ang lebel ng tubig sa 15cm sa ilalim ng lupa (-15cm). Kapag umabot dito, magpatubig lamang ng hanggang 5cm. Nakakatipid ito ng 30% hanggang 50% sa patubig nang hindi bumababa ang ani."
    },
    {
        "id": "da-awd-02",
        "title": "DA Advisory No. 2024-03: Drought-Tolerant Rice Varieties",
        "source": "DA_AWD_Rice_Protocol_2024.pdf",
        "page": 2,
        "content": "Kritikal na Yugto: Huwag patuyuin ang palayan sa panicle initiation hanggang flowering stage; panatilihin ang 2-3cm na tubig. Magtanim ng drought-tolerant certified seeds tulad ng NSIC Rc192 (Sahod Ulan 1), PSB Rc10 (Pagsanjan), at NSIC Rc222 (Tubigan 18)."
    },
    {
        "id": "pagasa-14-01",
        "title": "PAGASA Drought Bulletin #14: Strong El Niño Rainfall Anomaly",
        "source": "PAGASA_Drought_Bulletin_14.pdf",
        "page": 1,
        "content": "Umiiral ang Meteorological Drought sa Luzon at Western Visayas (mahigit 60% rainfall reduction sa loob ng 3 buwan). Inaasahang magpapatuloy ang tagtuyot hanggang sa huling linggo ng Mayo bago magsimula ang Habagat."
    },
    {
        "id": "doh-heat-01",
        "title": "DOH Heat Health Protocol 2024-08: Split-Shift at First Aid",
        "source": "DOH_Heat_Health_Protocol_2024.pdf",
        "page": 1,
        "content": "Split-Shift System sa Bukid: Mahigpit na ipinagbabawal ang mabigat na trabaho sa bukid mula 10:00 AM hanggang 3:00 PM. Magtrabaho mula 5:00 AM hanggang 9:30 AM at 3:30 PM hanggang 6:00 PM. Uminom ng 1 basong tubig bawat 20 minuto."
    },
    {
        "id": "doh-heat-02",
        "title": "DOH Protocol 2024-08: Heat Stroke Emergency Protocol",
        "source": "DOH_Heat_Health_Protocol_2024.pdf",
        "page": 3,
        "content": "First Aid sa Heat Stroke (nawalan ng malay, tuyong balat na walang pawis, temp > 40C): Tumawag agad ng ambulansya/BHERT. Buhusan ng malamig na tubig ang katawan at lagyan ng yelo sa leeg at kilikili habang naghihintay."
    },
    {
        "id": "dilg-rationing-01",
        "title": "DILG-LGU Memorandum Circular 2024-21: Water Rationing",
        "source": "DILG_LGU_Water_Contingency_MC2024.pdf",
        "page": 1,
        "content": "Barangay Water Crisis Committee: Magtalaga ng mga Bantay-Tubig (Water Marshals) sa communal deep wells. Ipatupad ang 20-litro bawat pamilya bawat araw na quota para sa inumin at pagluluto tuwing critical shortage."
    }
]

RELEVANT_KEYWORDS = [
    "rice", "palay", "tubig", "water", "drought", "tuyot", "drying", "awd",
    "init", "heat", "stroke", "exhaustion", "nahihilo", "first aid",
    "baboy", "manok", "hayop", "livestock", "ration", "balon", "deep well", "quota"
]

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3
    model: Optional[str] = "qwen2.5:3b"

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[str]
    context_chunks: List[dict]
    model_used: str
    is_offline: bool

def is_relevant(query: str) -> bool:
    q = query.lower()
    return any(k in q for k in RELEVANT_KEYWORDS)

def local_search(query: str, top_k: int = 3):
    terms = set(query.lower().split())
    scored = []
    for doc in FALLBACK_DOCUMENTS:
        doc_text = (doc["title"] + " " + doc["content"]).lower()
        score = sum(1 for term in terms if term in doc_text and len(term) > 2)
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:top_k] if item[0] > 0]

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "Patak: Offline El Niño Response Assistant",
        "badge": "Local mode: no internet needed",
        "model": OLLAMA_MODEL,
        "embedding_model": EMBED_MODEL,
        "vector_store": vector_store,
        "chunk_count": collection.count() if collection else len(FALLBACK_DOCUMENTS)
    }

@app.post("/api/query", response_model=QueryResponse)
def query_rag(req: QueryRequest):
    # 1. Relevance check to strictly prevent hallucinations
    if not is_relevant(req.query):
        return QueryResponse(
            query=req.query,
            answer=FALLBACK_RESPONSE,
            sources=[],
            context_chunks=[],
            model_used="Grounding Check",
            is_offline=True
        )

    # 2. Retrieve from ChromaDB or local fallback
    retrieved_docs = []
    if collection is not None and collection.count() > 0:
        try:
            # Try embedding query with nomic-embed-text
            q_emb = None
            try:
                emb_res = requests.post(
                    f"{OLLAMA_BASE_URL}/api/embeddings",
                    json={"model": EMBED_MODEL, "prompt": req.query},
                    timeout=10
                )
                if emb_res.status_code == 200:
                    q_emb = emb_res.json().get("embedding", [])
            except Exception:
                pass

            if q_emb:
                results = collection.query(query_embeddings=[q_emb], n_results=req.top_k)
            else:
                results = collection.query(query_texts=[req.query], n_results=req.top_k)

            if results and results.get("documents") and len(results["documents"][0]) > 0:
                for idx in range(len(results["documents"][0])):
                    meta = results["metadatas"][0][idx]
                    retrieved_docs.append({
                        "id": results["ids"][0][idx],
                        "content": results["documents"][0][idx],
                        "source": meta.get("source", "Official Advisory"),
                        "page": meta.get("page", 1),
                        "title": meta.get("title", meta.get("source", "Advisory"))
                    })
        except Exception as e:
            print(f"[RAG Error] ChromaDB query failed: {e}")
            retrieved_docs = local_search(req.query, req.top_k)
    else:
        retrieved_docs = local_search(req.query, req.top_k)

    if not retrieved_docs:
        return QueryResponse(
            query=req.query,
            answer=FALLBACK_RESPONSE,
            sources=[],
            context_chunks=[],
            model_used="Zero Match Fallback",
            is_offline=True
        )

    # Build Grounded Context
    context_text = "\n\n".join([
        f"--- SANGGUNIAN [{doc.get('source', 'Advisory')}, Page {doc.get('page', 1)}]: {doc.get('title', '')} ---\n{doc.get('content', '')}"
        for doc in retrieved_docs
    ])

    user_prompt = f"""CONTEXT ADVISORIES:
{context_text}

USER QUESTION:
"{req.query}"

Sagutin bilang isang pambungad na pangungusap sa Taglish at maikling action checklist kung saan ang BAWAT bullet point ay naglalaman ng citation [Filename.pdf, Page X]."""

    # 3. Query Ollama qwen2.5:3b with robust timeout (90s)
    ollama_model = req.model or OLLAMA_MODEL
    try:
        ollama_response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": ollama_model,
                "system": SYSTEM_PROMPT_TEMPLATE,
                "prompt": user_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Strict low temperature
                    "top_p": 0.9
                }
            },
            timeout=90
        )
        if ollama_response.status_code == 200:
            answer_text = ollama_response.json().get("response", "").strip()
        else:
            answer_text = build_deterministic_checklist(retrieved_docs)
    except Exception:
        # Fallback when Ollama daemon is starting up
        answer_text = build_deterministic_checklist(retrieved_docs)

    unique_sources = list({
        f"{d.get('source', 'Advisory')} (Page {d.get('page', 1)})"
        for d in retrieved_docs if d.get("source")
    })

    return QueryResponse(
        query=req.query,
        answer=answer_text,
        sources=unique_sources,
        context_chunks=retrieved_docs,
        model_used=ollama_model,
        is_offline=True
    )

def build_deterministic_checklist(retrieved_docs: List[dict]) -> str:
    lines = [
        "Narito ang agarang action checklist batay sa mga opisyal na advisory para sa inyong sitwasyon:",
        ""
    ]
    for idx, doc in enumerate(retrieved_docs, start=1):
        content = doc.get("content", "")
        clean_sentence = content.split(".")[0].strip()
        lines.append(f"{idx}. {clean_sentence}. [{doc.get('source', 'Official Advisory')}, Page {doc.get('page', 1)}]")

    lines.append("")
    lines.append("Paalala: Makipag-ugnayan agad sa inyong Punong Barangay o BDRRMC para sa karagdagang tulong.")
    return "\n".join(lines)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
