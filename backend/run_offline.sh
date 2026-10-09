#!/usr/bin/env bash
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
                echo "  ✓ Ollama daemon successfully started after ${i}s."
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
CHROMA_DIR="../chroma_db_streamlit"
if [ ! -d "$CHROMA_DIR" ] || [ $(find "$CHROMA_DIR" -type f 2>/dev/null | wc -l) -lt 2 ]; then
    echo "  ⚡ Running automated ingestion script (ingest.py)..."
    python ingest.py || echo "  Advisories will be seeded upon startup."
else
    echo "  ✓ ChromaDB directory is populated."
fi

# 4. Launch Streamlit app
echo "[4/4] Launching Streamlit application..."
echo "=================================================================="
cd .. && streamlit run app_streamlit.py --server.headless=false
