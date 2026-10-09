# 💧 Patak: Offline El Niño Response Assistant

An offline-first, local RAG system engineered for Philippine barangay officials, local disaster officers (BDRRMC/LDRRMO), and rural farmers.

**Local mode: no internet needed · Zero Cloud APIs · Automated Single-Command Setup**

---

## ⚡ 1-Click Automated Startup

Instead of manually starting multiple terminal windows, running separate vector ingestion commands, and downloading models individually, use the **automated startup script**:

### On Linux / macOS:
```bash
chmod +x run_offline.sh
./run_offline.sh
```

### On Windows / Cross-Platform (Python):
```bash
python startup.py
```

### What the Automated Startup Script Does Automatically:
1. **Checks Ollama Daemon:** Verifies if `http://localhost:11434` is active. If not, spawns `ollama serve` in the background and waits until it is fully initialized.
2. **Auto-Pulls Offline Models:** Checks `ollama list`. If `nomic-embed-text` or `qwen2.5:3b` are missing, automatically downloads them via `ollama pull`.
3. **Auto-Populates Vector Database:** Checks if the local ChromaDB database exists and contains chunks. If empty, automatically executes the ingestion pipeline on pre-loaded official public advisories (DA-PhilRice, PAGASA, DOH, DILG, DA-BAI).
4. **Launches Streamlit:** Starts `streamlit run app_streamlit.py` directly in a single command.

---

## 🛠️ Manual Step-by-Step Setup (If preferred)

### 1. Install Ollama
Download and install Ollama from [https://ollama.com](https://ollama.com).

### 2. Pull Required Quantized Models
```bash
# 1. Embedding model for local ChromaDB vectors
ollama pull nomic-embed-text

# 2. Generation model (fast 3B multilingual model for Taglish/English)
ollama pull qwen2.5:3b
```

### 3. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
pip install streamlit pypdf
```

### 4. (Optional) Run Vector Ingestion
```bash
python backend/ingest.py
```
*(Note: `app_streamlit.py` also self-seeds the database automatically on first run if no vectors are detected.)*

### 5. Launch Streamlit
```bash
streamlit run app_streamlit.py
```

---

## 🐳 Pre-Bundled Docker Deployment (Zero-Install Vector DB)

If you wish to package the application with pre-computed ChromaDB vectors so users don't need any local ingestion step:

```bash
# 1. Build the container (pre-indexes advisories into ChromaDB during build)
docker build -t patak-offline .

# 2. Run container (connects to local host Ollama daemon)
docker run -p 8501:8501 --add-host=host.docker.internal:host-gateway patak-offline
```

Open `http://localhost:8501` in your browser.

---

## 🔒 Zero-Hallucination & Grounding Guarantees

1. **Strict Prompt Engineering:** The prompt forces the model to respond ONLY with an introductory Taglish sentence, a short 3-to-6 bullet action checklist, and an exact `[Filename.pdf, Page X]` citation at the end of **every bullet point**.
2. **Automated Fallback:** If the user query is outside the indexed domain or if vector similarity returns no matching chunks, the system immediately returns:
   > *"Pasensya na, wala itong impormasyon sa aking offline database. Mangyaring sumangguni sa Municipal Agriculture Office (MAO) o sa pinakamalapit na Rural Health Unit (RHU)."*
3. **Exact Citations:** Advisories are indexed with page-level granularity:
   - `DA_AWD_Rice_Protocol_2024.pdf` (Pages 1, 2, 3)
   - `PAGASA_Drought_Bulletin_14.pdf` (Pages 1, 2)
   - `DOH_Heat_Health_Protocol_2024.pdf` (Pages 1, 2, 3)
   - `DA_BAI_Livestock_Heat_Stress_Guide.pdf` (Pages 1, 2)
   - `DILG_LGU_Water_Contingency_MC2024.pdf` (Pages 1, 2)
# PatakAPP
# PatakAPP
# PatakAPP
# PatakAPP
