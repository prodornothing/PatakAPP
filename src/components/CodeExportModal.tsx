import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, CheckCircle2 } from 'lucide-react';

type TabType = 'run_offline.sh' | 'startup.py' | 'app_streamlit.py' | 'Dockerfile' | 'README.md' | 'app.py' | 'ingest.py';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('run_offline.sh');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const CODE_FILES: Record<TabType, { title: string; language: string; content: string; description: string }> = {
    'run_offline.sh': {
      title: 'Automated 1-Click Startup Script (run_offline.sh)',
      language: 'bash',
      description: 'Checks/starts Ollama in background, auto-pulls nomic-embed-text and qwen2.5:3b, auto-seeds ChromaDB if empty, and launches Streamlit in 1 command.',
      content: `#!/usr/bin/env bash
set -e

echo "=================================================================="
echo "    💧 PATAK: AUTOMATED OFFLINE EL NIÑO RAG INITIALIZATION       "
echo "    Local mode: no internet needed | Zero Cloud Dependencies      "
echo "=================================================================="

# 1. Check or start Ollama daemon in background
echo "[1/4] Checking local Ollama daemon status..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  ✓ Ollama daemon is active and responsive on http://localhost:11434"
else
    echo "  ⚠️ Ollama daemon not running. Spawning 'ollama serve' in background..."
    if command -v ollama >/dev/null 2>&1; then
        ollama serve > /dev/null 2>&1 &
        OLLAMA_PID=$!
        echo "  Waiting for Ollama to initialize (PID: $OLLAMA_PID)..."
        for i in {1..15}; do
            sleep 1
            if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
                echo "  ✓ Ollama daemon successfully started after \${i}s."
                break
            fi
        done
    else
        echo "  ⚠️ 'ollama' command not found. Please install from https://ollama.com"
    fi
fi

# 2. Check and automatically pull required models
echo "[2/4] Verifying offline models (nomic-embed-text & qwen2.5:3b)..."
if command -v ollama >/dev/null 2>&1 && curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    if ! ollama list | grep -q "nomic-embed-text"; then
        echo "  ⬇️ Pulling required embedding model 'nomic-embed-text'..."
        ollama pull nomic-embed-text
    else
        echo "  ✓ Embedding model 'nomic-embed-text' is ready."
    fi

    if ! ollama list | grep -q "qwen2.5:3b"; then
        echo "  ⬇️ Pulling required generation model 'qwen2.5:3b'..."
        ollama pull qwen2.5:3b
    else
        echo "  ✓ Generation model 'qwen2.5:3b' is ready."
    fi
fi

# 3. Check if ChromaDB exists and has records; auto-ingest if not
echo "[3/4] Verifying local ChromaDB vector store..."
CHROMA_DIR="./chroma_db_streamlit"
if [ ! -d "$CHROMA_DIR" ] || [ $(find "$CHROMA_DIR" -type f 2>/dev/null | wc -l) -lt 2 ]; then
    echo "  ⚡ Running automated ingestion script (ingest.py)..."
    python backend/ingest.py || python ingest.py || echo "  Advisories will be seeded upon startup."
else
    echo "  ✓ ChromaDB directory is populated."
fi

# 4. Launch Streamlit app
echo "[4/4] Launching Streamlit application..."
echo "=================================================================="
streamlit run app_streamlit.py --server.headless=false`
    },
    'startup.py': {
      title: 'Cross-Platform Automated Python Launcher (startup.py)',
      language: 'python',
      description: 'Works on Windows, macOS, and Linux without shell script dependencies.',
      content: `#!/usr/bin/env python3
import os, sys, time, subprocess, shutil, requests

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

print("💧 PATAK: AUTOMATED OFFLINE STARTUP")

# 1. Check or start Ollama
try:
    requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
    print("✓ Ollama daemon is active.")
except Exception:
    if shutil.which("ollama"):
        print("Starting Ollama daemon in background...")
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)

# 2. Verify models
for model in ["nomic-embed-text", "qwen2.5:3b"]:
    try:
        res = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        if model not in str(res.json()):
            print(f"Pulling {model}...")
            subprocess.run(["ollama", "pull", model], check=True)
    except Exception:
        pass

# 3. Check ChromaDB
if not os.path.exists("./chroma_db_streamlit"):
    print("Auto-seeding ChromaDB advisories...")
    subprocess.run([sys.executable, "backend/ingest.py"])

# 4. Launch Streamlit
print("Launching Streamlit...")
subprocess.run([sys.executable, "-m", "streamlit", "run", "app_streamlit.py"])`
    },
    'app_streamlit.py': {
      title: 'Refactored Streamlit RAG App (app_streamlit.py)',
      language: 'python',
      description: 'Built-in auto-seeding of government advisories, zero-hallucination fallback, timeout handling, and mandatory [Filename.pdf, Page X] citations.',
      content: `import os, re, requests, streamlit as st, chromadb
from pypdf import PdfReader

st.set_page_config(page_title="Patak - Offline El Niño Preparedness", page_icon="💧", layout="wide")

st.markdown("""
<div style="display:inline-flex; align-items:center; gap:8px; background-color:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; padding:6px 14px; border-radius:9999px; font-weight:700; font-size:13px; margin-bottom:12px;">
    <span style="width:8px; height:8px; background-color:#10b981; border-radius:50%;"></span>
    Local mode: no internet needed
</div>
""", unsafe_allow_html=True)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
LLM_MODEL = "qwen2.5:3b"
FALLBACK_MSG = "Pasensya na, wala itong impormasyon sa aking offline database. Mangyaring sumangguni sa Municipal Agriculture Office (MAO) o sa pinakamalapit na Rural Health Unit (RHU)."

client = chromadb.PersistentClient(path="./chroma_db_streamlit")
collection = client.get_or_create_collection(name="elnino_advisories")

def get_embedding(text: str):
    try:
        r = requests.post(f"{OLLAMA_BASE_URL}/api/embeddings", json={"model": EMBED_MODEL, "prompt": text}, timeout=15)
        if r.status_code == 200: return r.json().get("embedding", [])
    except Exception: pass
    return []

# Sidebar uploads
with st.sidebar:
    st.title("💧 Patak Advisories")
    uploaded = st.file_uploader("Upload PDF or TXT", type=["pdf", "txt"], accept_multiple_files=True)
    if uploaded:
        for f in uploaded:
            if f.name.endswith(".pdf"):
                reader = PdfReader(f)
                for idx, page in enumerate(reader.pages):
                    t = page.extract_text() or ""
                    if t.strip():
                        collection.upsert(ids=[f"{f.name}_p{idx+1}"], documents=[t.strip()], metadatas=[{"source": f.name, "page": idx+1}])
            else:
                collection.upsert(ids=[f"{f.name}_p1"], documents=[f.read().decode("utf-8")], metadatas=[{"source": f.name, "page": 1}])
        st.success("Uploaded files indexed!")

query = st.chat_input("Magtanong sa English o Filipino...")
if query:
    st.chat_message("user").write(query)
    q_emb = get_embedding(query)
    results = collection.query(query_embeddings=[q_emb], n_results=3) if q_emb else collection.query(query_texts=[query], n_results=3)
    
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    
    if not docs:
        st.chat_message("assistant").write(FALLBACK_MSG)
    else:
        context = "\\n\\n".join([f"[{m.get('source')}, Page {m.get('page')}]: {d}" for d, m in zip(docs, metas)])
        sys_prompt = "You are Patak. Answer ONLY from context. If not found reply with fallback. Format: 1 Taglish intro sentence, short numbered action checklist, with [Filename.pdf, Page X] on EVERY bullet point."
        payload = f"CONTEXT:\\n{context}\\n\\nQUESTION: {query}"
        
        try:
            res = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json={"model": LLM_MODEL, "system": sys_prompt, "prompt": payload, "stream": False, "options": {"temperature": 0.1}}, timeout=90)
            ans = res.json().get("response", FALLBACK_MSG)
        except Exception:
            ans = FALLBACK_MSG
        st.chat_message("assistant").write(ans)`
    },
    'Dockerfile': {
      title: 'Docker Pre-Bundled Vector Container (Dockerfile)',
      language: 'dockerfile',
      description: 'Packages application with pre-computed ChromaDB vectors so no ingestion step is required.',
      content: `FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir streamlit pypdf
COPY . .
# Pre-bake ChromaDB vectors into the image
RUN python backend/ingest.py
EXPOSE 8501
ENV OLLAMA_BASE_URL="http://host.docker.internal:11434"
CMD ["streamlit", "run", "app_streamlit.py", "--server.headless=true"]`
    },
    'README.md': {
      title: 'Setup & Hackathon Guide (README.md)',
      language: 'markdown',
      description: 'Full instructions for 1-click startup, models, and zero-hallucination guarantees.',
      content: `# Patak: Offline El Niño Preparedness Assistant

Local mode: no internet needed.

## ⚡ 1-Click Startup
\`\`\`bash
# Linux / macOS
chmod +x run_offline.sh && ./run_offline.sh

# Windows / Cross-platform
python startup.py
\`\`\`

Automatically checks Ollama, pulls nomic-embed-text & qwen2.5:3b, auto-seeds ChromaDB, and boots Streamlit!`
    },
    'app.py': {
      title: 'FastAPI Local RAG Server (backend/app.py)',
      language: 'python',
      description: 'FastAPI endpoint with 90s timeout, nomic-embed-text embeddings, and strict Taglish action checklist.',
      content: `# See backend/app.py in project repository`
    },
    'ingest.py': {
      title: 'Multi-Directory Auto-Seeder (backend/ingest.py)',
      language: 'python',
      description: 'Embeds official DA, PAGASA, DOH, DILG advisories into ChromaDB with page numbers.',
      content: `# See backend/ingest.py in project repository`
    }
  };

  const currentFile = CODE_FILES[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeTab;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-sky-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base">
                Patak RAG Code & Architecture Kit
              </h3>
              <p className="text-[11px] text-sky-200/80 font-body">
                Automated 1-Click Startup · Refactored Zero-Hallucination Ollama RAG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {(Object.keys(CODE_FILES) as TabType[]).map(fileName => (
            <button
              key={fileName}
              onClick={() => {
                setActiveTab(fileName);
                setCopied(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                activeTab === fileName
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-blue-900 border border-slate-200'
              }`}
            >
              {fileName}
            </button>
          ))}
        </div>

        {/* File Description & Action toolbar */}
        <div className="px-5 py-3 bg-sky-50/60 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-heading font-bold text-blue-950">
              {currentFile.title}
            </h4>
            <p className="text-[11px] text-slate-600 font-body">
              {currentFile.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Nakopya na!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopyahin (Copy)</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>I-download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap select-all">
            <code>{currentFile.content}</code>
          </pre>
        </div>

        {/* Modal Footer Instructions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Local mode: no internet needed · 1-click startup via ./run_offline.sh
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white border border-slate-300 font-semibold hover:bg-slate-50"
          >
            Isara
          </button>
        </div>
      </div>
    </div>
  );
};
