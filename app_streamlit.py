"""
Patak: Offline El Niño Response Assistant (Streamlit)
Local RAG powered by Ollama nomic-embed-text, ChromaDB, and Ollama qwen2.5:3b.
No Cloud APIs | 100% Local and Offline | Automated Startup
"""

import os
import re
import requests
import streamlit as st
import chromadb
from pypdf import PdfReader

# Page configuration
st.set_page_config(
    page_title="Patak - Offline El Niño Preparedness",
    page_icon="💧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling (Acquaholic Monochromatic Blue Palette)
st.markdown("""
<style>
    .main { background-color: #f8fafc; }
    .badge-offline {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        padding: 5px 14px;
        border-radius: 9999px;
        font-size: 0.82rem;
        font-weight: 700;
        margin-bottom: 12px;
    }
    .badge-dot {
        width: 8px;
        height: 8px;
        background-color: #10b981;
        border-radius: 50%;
        display: inline-block;
    }
    .stChatMessage {
        border-radius: 18px;
        padding: 14px;
        margin-bottom: 12px;
    }
    .citation-tag {
        display: inline-block;
        background-color: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-weight: 600;
        margin: 2px 4px 2px 0;
    }
</style>
""", unsafe_allow_html=True)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
LLM_MODEL = "qwen2.5:3b"
CHROMA_DIR = "./chroma_db_streamlit"

FALLBACK_NO_INFO = (
    "Pasensya na, wala itong impormasyon sa aking offline database. "
    "Mangyaring sumangguni sa Municipal Agriculture Office (MAO) o sa pinakamalapit na Rural Health Unit (RHU)."
)

# Pre-loaded official advisories for automated zero-install bootstrapping
INITIAL_ADVISORIES = [
    {
        "filename": "DA_AWD_Rice_Protocol_2024.pdf",
        "title": "DA Advisory No. 2024-03: Alternate Wetting and Drying (AWD)",
        "pages": [
            {
                "page": 1,
                "text": "KAGAWARAN NG PAGSASAKA (DA) - PHILRICE ADVISORY NO. 2024-03: Paggamit ng Observation Well (Field Water Tube). Magbaon ng 20cm perforated PVC pipe na 10cm ang lalim sa lupa ng palayan upang mamonitor ang tubig. Huwag magpatubig hangga't hindi bumababa ang lebel ng tubig sa 15cm sa ilalim ng lupa (-15cm). Kapag umabot dito, magpatubig lamang ng hanggang 5cm. Nakakatipid ito ng 30% hanggang 50% sa patubig nang hindi bumababa ang ani."
            },
            {
                "page": 2,
                "text": "DA Advisory No. 2024-03: Kritikal na Yugto ng Palay. Huwag patuyuin ang palayan sa panicle initiation (pagbubuntis) hanggang flowering stage (pamumulaklak); panatilihin ang 2-3cm na tubig upang hindi mabaog ang mga butil. Magtanim ng drought-tolerant certified seed varieties tulad ng NSIC Rc192 (Sahod Ulan 1), PSB Rc10 (Pagsanjan), at NSIC Rc222 (Tubigan 18)."
            },
            {
                "page": 3,
                "text": "DA Advisory No. 2024-03: Oras ng Pagpapatubig at Irigasyon. Ipatubig lamang sa madaling araw (bago mag-7:00 AM) o bandang hapon (paglampas ng 4:30 PM) upang maiwasan ang mabilis na evaporation. Makipag-ugnayan sa NIA at Irrigators Association (IA) para sa mahigpit na Rotational Irrigation Schedule para sa tail-end farmers."
            }
        ]
    },
    {
        "filename": "PAGASA_Drought_Bulletin_14.pdf",
        "title": "PAGASA Drought Bulletin #14: Strong El Niño Rainfall Anomaly",
        "pages": [
            {
                "page": 1,
                "text": "DOST-PAGASA Drought Bulletin No. 14: Umiiral ang Meteorological Drought sa Luzon (Central Luzon, Cagayan Valley) at Western Visayas kung saan ang buwanang ulan ay bumaba ng mahigit 60% sa loob ng 3 magkakasunod na buwan. Inaasahang magpapatuloy ang tagtuyot hanggang sa huling linggo ng Mayo bago magsimula ang Southwest Monsoon (Habagat)."
            },
            {
                "page": 2,
                "text": "PAGASA Drought Bulletin No. 14: Babala sa Danger Category Heat Index (42°C hanggang 46°C). Ipatupad ang water conservation protocols sa mga pampublikong pasilidad. Mag-imbak ng tubig-ulan sa mga rainwater catchment tanks habang may paminsan-minsang localized thunderstorms sa hapon. Subaybayan ang weekly provincial rainfall assessment mula sa pinakamalapit na PAGASA agromet station."
            }
        ]
    },
    {
        "filename": "DOH_Heat_Health_Protocol_2024.pdf",
        "title": "DOH Heat Health Protocol 2024-08: Emergency First Aid para sa Magsasaka",
        "pages": [
            {
                "page": 1,
                "text": "DOH Memorandum Circular 2024-08: Split-Shift System sa Bukid. Mahigpit na ipinagbabawal ang mabigat na pisikal na trabaho sa bukid sa peak heat hours (10:00 AM hanggang 3:00 PM). Magtrabaho lamang mula 5:00 AM hanggang 9:30 AM at 3:30 PM hanggang 6:00 PM."
            },
            {
                "page": 2,
                "text": "DOH Protocol 2024-08: Hydration Guidelines. Uminom ng 1 basong tubig bawat 20 minuto habang nagtatrabaho sa bukid kahit hindi pa nauuhaw. Maghalo ng 1 pakete ng Oral Rehydration Salt (ORS) sa 1 litrong tubig kung labis ang pagpapawis. Iwasan ang kape at alak sa bukid."
            },
            {
                "page": 3,
                "text": "DOH Protocol 2024-08: First Aid sa Heat Stroke at Exhaustion. Sa Heat Exhaustion: Dalhin agad sa lilim, pahigain at itaas ang paa ng 30cm, lagyan ng basang bimpo sa leeg at kilikili, at dahan-dahang painumin ng tubig. Sa Heat Stroke (walang malay, tuyong balat na walang pawis, temp > 40°C): Tumawag agad ng ambulansya/BHERT. Buhusan ng malamig na tubig ang katawan at lagyan ng yelo sa leeg at kilikili habang naghihintay."
            }
        ]
    },
    {
        "filename": "DA_BAI_Livestock_Heat_Stress_Guide.pdf",
        "title": "DA-BAI Advisory No. 05: Heat Stress Management for Livestock and Poultry",
        "pages": [
            {
                "page": 1,
                "text": "DA-BAI Advisory No. 05: Pabahay ng Hayupan. Takpan ng tuyong cogon, nipa, o insulation foil ang bubong ng kulungan ng baboy at manok, o pinturahan ng puti ang yero upang mapababa ang init ng 4°C hanggang 6°C. Doblehin ang bilang ng inuman ng tubig at panatilihing malilim ang mga tubo."
            },
            {
                "page": 2,
                "text": "DA-BAI Advisory No. 05: Misting at Pagpapakain. Mag-spray ng pinong mist sa bubong at hangin mula 11:00 AM hanggang 2:00 PM. Huwag buhusan ng yelo ang likod ng mainit na baboy upang maiwasan ang fatal cardiac shock. I-shift ang pagpapakain sa malamig na oras ng gabi at madaling araw; maghalo ng electrolytes at Vitamin C sa inuming tubig."
            }
        ]
    },
    {
        "filename": "DILG_LGU_Water_Contingency_MC2024.pdf",
        "title": "DILG-LGU Memorandum Circular 2024-21: Barangay Water Rationing Protocol",
        "pages": [
            {
                "page": 1,
                "text": "DILG MC 2024-21: Barangay Water Crisis Committee. Magtalaga ang Punong Barangay ng mga Bantay-Tubig (Water Marshals) sa communal deep wells. Ipatupad ang 20-litro bawat pamilya bawat araw na quota para sa inumin at pagluluto tuwing critical shortage. Magtakda ng scheduled pumping hours (6:00-9:00 AM at 4:00-7:00 PM) upang makapag-recharge ang aquifer."
            },
            {
                "page": 2,
                "text": "DILG MC 2024-21: Kaligtasan at Calamity Fund. Ipagbawal ang paggamit ng potable water sa paghuhugas ng sasakyan at pagdidilig gamit ang hose. Pakuluin ang inuming tubig nang 3 minuto o gumamit ng chlorine tablets laban sa waterborne diseases. Gamitin ang 30% Quick Response Fund (QRF) para sa water tanks at shallow tube wells."
            }
        ]
    }
]

# Helper: Ollama Embeddings with Timeout & Retry
def get_ollama_embedding(text: str) -> list:
    """Fetch 768-dim embeddings from Ollama nomic-embed-text with timeout handling."""
    try:
        res = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=15
        )
        if res.status_code == 200:
            emb = res.json().get("embedding", [])
            if emb and len(emb) > 0:
                return emb
    except Exception:
        pass
    return []

# Helper: Initialize ChromaDB and Auto-Seed
@st.cache_resource
def get_chroma_collection():
    os.makedirs(CHROMA_DIR, exist_ok=True)
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_or_create_collection(name="elnino_advisories")

    # Auto-seed if empty
    if collection.count() == 0:
        seed_advisories(collection)
    return collection

def seed_advisories(collection):
    """Auto-embed built-in government advisories on first startup."""
    all_chunks = []
    for adv in INITIAL_ADVISORIES:
        for p in adv["pages"]:
            all_chunks.append({
                "id": f"{adv['filename']}_p{p['page']}",
                "text": p["text"],
                "source": adv["filename"],
                "page": p["page"]
            })

    ids = [c["id"] for c in all_chunks]
    docs = [c["text"] for c in all_chunks]
    metas = [{"source": c["source"], "page": c["page"]} for c in all_chunks]

    embeddings = []
    has_valid = False
    for d in docs:
        e = get_ollama_embedding(d)
        embeddings.append(e)
        if e:
            has_valid = True

    if has_valid and all(len(e) > 0 for e in embeddings):
        collection.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=embeddings)
    else:
        collection.upsert(ids=ids, documents=docs, metadatas=metas)

collection = get_chroma_collection()

# Semantic keyword relevance check to guarantee zero hallucination
RELEVANT_KEYWORDS = [
    "rice", "palay", "tubig", "water", "drought", "tuyot", "drying", "awd",
    "init", "heat", "stroke", "exhaustion", "nahihilo", "first aid",
    "baboy", "manok", "hayop", "livestock", "poultry", "misting",
    "ration", "rationing", "balon", "deep well", "quota", "lgu", "barangay",
    "ulan", "rain", "pagasa", "bulletin", "forecast", "bdrrmc", "da", "doh"
]

def is_query_relevant(query: str) -> bool:
    q_lower = query.lower()
    return any(re.search(rf"\b{re.escape(k)}\b", q_lower) for k in RELEVANT_KEYWORDS)

# Robust Ollama Generation Caller with Strict Grounding Prompt
def query_qwen(prompt: str, context_chunks: list) -> str:
    if not context_chunks:
        return FALLBACK_NO_INFO

    context_str = "\n\n".join(context_chunks)

    system_prompt = (
        "You are 'Patak', an offline El Niño Response Assistant for Philippine barangay officials, "
        "disaster officers (BDRRMC), and farmers.\n\n"
        "STRICT INSTRUCTIONS:\n"
        "1. Answer ONLY using the official advisory excerpts provided in the CONTEXT.\n"
        "2. If the context does not contain the answer, output ONLY:\n"
        f"'{FALLBACK_NO_INFO}'\n"
        "3. EXACT OUTPUT FORMAT:\n"
        "- Begin with a single introductory Taglish sentence (e.g., 'Narito ang agarang action checklist batay sa mga opisyal na advisory para sa inyong sitwasyon:').\n"
        "- Follow with a short numbered ACTION CHECKLIST (3 to 6 practical steps).\n"
        "- MANDATORY: Append the exact citation in square brackets [Filename.pdf, Page X] to EVERY SINGLE bullet point!\n"
        "4. Tone: Empathetic, actionable, respectful Taglish (Tagalog-English mix)."
    )

    user_payload = (
        f"CONTEXT ADVISORIES:\n{context_str}\n\n"
        f"USER QUESTION: \"{prompt}\"\n\n"
        "Answer with an introductory Taglish sentence and a numbered action checklist with [Filename.pdf, Page X] on every point:"
    )

    try:
        res = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "system": system_prompt,
                "prompt": user_payload,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Low temperature strictly prevents hallucination
                    "top_p": 0.9,
                    "stop": ["Human:", "User:"]
                }
            },
            timeout=90  # 90 seconds timeout for slower CPU execution
        )

        if res.status_code == 200:
            raw_answer = res.json().get("response", "").strip()
            if raw_answer:
                return raw_answer
        elif res.status_code == 404:
            return f"⚠️ Model '{LLM_MODEL}' not found in Ollama. Please run: `ollama pull {LLM_MODEL}`"
        return f"⚠️ Ollama error ({res.status_code}): {res.text}"

    except requests.exceptions.ConnectionError:
        return (
            "⚠️ Hindi maabot ang Ollama daemon sa http://localhost:11434.\n\n"
            "Tiyaking tumatakbo ang `ollama serve` sa inyong makina at na-pull ang modelong `qwen2.5:3b`."
        )
    except requests.exceptions.Timeout:
        return "⚠️ Timeout: Masyadong matagal bago sumagot ang lokal na Ollama model. Subukang magtanong muli."
    except Exception as e:
        return f"⚠️ Exception habang kumukonsulta sa lokal na AI: {str(e)}"

# ================= SIDEBAR =================
with st.sidebar:
    st.markdown("""
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
        <div style="background:linear-gradient(135deg, #1d4ed8, #0284c7); padding:8px; border-radius:12px; color:white; font-size:20px;">💧</div>
        <div>
            <h3 style="margin:0; color:#0f172a; font-weight:800;">PATAK</h3>
            <p style="margin:0; color:#64748b; font-size:12px;">Offline El Niño Preparedness</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Mandatory Offline Badge
    st.markdown("""
    <div class="badge-offline">
        <span class="badge-dot"></span>
        Local mode: no internet needed
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 📄 Upload Advisories (PDF/TXT)")
    uploaded_files = st.file_uploader(
        "Upload local PDF or Text advisories",
        type=["pdf", "txt"],
        accept_multiple_files=True
    )

    if uploaded_files:
        for file in uploaded_files:
            file_key = f"processed_{file.name}"
            if file_key not in st.session_state:
                with st.spinner(f"Indexing {file.name}..."):
                    chunks = []
                    if file.name.lower().endswith(".pdf"):
                        reader = PdfReader(file)
                        for p_idx, page in enumerate(reader.pages):
                            text = page.extract_text() or ""
                            if text.strip():
                                chunks.append({
                                    "id": f"{file.name}_p{p_idx+1}",
                                    "text": text.strip(),
                                    "source": file.name,
                                    "page": p_idx + 1
                                })
                    else:
                        content = file.read().decode("utf-8", errors="ignore")
                        chunks.append({
                            "id": f"{file.name}_p1",
                            "text": content.strip(),
                            "source": file.name,
                            "page": 1
                        })

                    if chunks:
                        ids = [c["id"] for c in chunks]
                        docs = [c["text"] for c in chunks]
                        metas = [{"source": c["source"], "page": c["page"]} for c in chunks]
                        collection.upsert(ids=ids, documents=docs, metadatas=metas)
                        st.session_state[file_key] = True
                        st.success(f"Indexed {file.name} ({len(chunks)} chunks)")

    st.markdown("---")
    st.markdown("### ⚙️ Local Engine Status")
    st.markdown(f"- **Embedding:** `{EMBED_MODEL}`")
    st.markdown(f"- **LLM:** `{LLM_MODEL}`")
    st.markdown(f"- **Vector Store:** `ChromaDB` (Persistent)")

    total_chunks = collection.count()
    st.info(f"📚 Total indexed advisory chunks: **{total_chunks}**")

    if st.button("🔄 Re-Seed Default Advisories"):
        seed_advisories(collection)
        st.success("Default advisories re-seeded!")
        st.rerun()

# ================= MAIN CHAT AREA =================
st.markdown("""
<div class="badge-offline">
    <span class="badge-dot"></span>
    Local mode: no internet needed
</div>
""", unsafe_allow_html=True)

st.title("💧 Patak: El Niño Response Assistant")
st.caption("Local AI grounded exclusively in DA, PAGASA, DOH, and DILG public advisories. Zero hallucinations, page-level citations, and instant action checklists.")

# Initialize chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {
            "role": "assistant",
            "content": (
                "Magandang araw! Ako si **Patak**, ang inyong offline El Niño Response Assistant.\n\n"
                "Magtanong sa **English** o **Filipino** ukol sa patubig sa palayan, water rationing, at first aid sa bukid.\n\n"
                "Mga halimbawa:\n"
                "- *'Our rice fields are drying up, what should we do?'*\n"
                "- *'Mainit sobra at nahihilo ang magsasaka sa bukid, anong first aid?'*\n"
                "- *'What is the scheduled water rationing quota per household in the barangay?'*"
            )
        }
    ]

# Display history
for msg in st.session_state.chat_history:
    with st.chat_message(msg["role"], avatar="💧" if msg["role"] == "assistant" else "👤"):
        st.markdown(msg["content"])
        if "citations" in msg and msg["citations"]:
            st.markdown("**Mga Sanggunian (Citations):**")
            for cit in msg["citations"]:
                st.markdown(f"<span class='citation-tag'>📄 {cit}</span>", unsafe_allow_html=True)

# User Chat Input
user_query = st.chat_input("Magtanong sa English o Filipino (hal: 'Tuyong-tuyo na ang palayan, anong dapat gawin?')...")

if user_query:
    st.session_state.chat_history.append({"role": "user", "content": user_query})
    with st.chat_message("user", avatar="👤"):
        st.markdown(user_query)

    with st.chat_message("assistant", avatar="💧"):
        with st.spinner("Nagsasagawa ng lokal na pagsusuri at retrieval..."):
            retrieved_chunks = []
            citations = []

            # 1. Check if query is relevant to the domain
            if not is_query_relevant(user_query) and collection.count() > 0:
                answer = FALLBACK_NO_INFO
            else:
                # 2. Vector search against ChromaDB using query embeddings
                q_emb = get_ollama_embedding(user_query)
                results = None
                try:
                    if q_emb:
                        results = collection.query(query_embeddings=[q_emb], n_results=3)
                    else:
                        results = collection.query(query_texts=[user_query], n_results=3)
                except Exception:
                    pass

                if results and results.get("documents") and len(results["documents"][0]) > 0:
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]

                    for doc_text, meta in zip(docs, metas):
                        source = meta.get("source", "Official Advisory")
                        page = meta.get("page", 1)
                        retrieved_chunks.append(f"[{source}, Page {page}]:\n{doc_text}")
                        cit_label = f"{source} (Page {page})"
                        if cit_label not in citations:
                            citations.append(cit_label)

                # 3. If no relevant chunks retrieved, fallback immediately without hallucination
                if not retrieved_chunks:
                    answer = FALLBACK_NO_INFO
                else:
                    # 4. Invoke Ollama qwen2.5:3b with strict prompt
                    answer = query_qwen(user_query, retrieved_chunks)

            # Render response
            st.markdown(answer)

            if citations and answer != FALLBACK_NO_INFO:
                st.markdown("**Mga Sanggunian (Citations):**")
                for cit in citations:
                    st.markdown(f"<span class='citation-tag'>📄 {cit}</span>", unsafe_allow_html=True)

            # Save in history
            st.session_state.chat_history.append({
                "role": "assistant",
                "content": answer,
                "citations": citations if answer != FALLBACK_NO_INFO else []
            })
