#!/usr/bin/env python3
"""
Patak: Automated Offline Startup & RAG Pipeline Orchestrator
- Checks / starts Ollama daemon
- Automatically pulls nomic-embed-text and qwen2.5:3b if missing
- Automatically seeds and checks local ChromaDB with government advisories
- Seamlessly boots Streamlit app in a single command
"""

import os
import sys
import time
import subprocess
import shutil
import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
LLM_MODEL = "qwen2.5:3b"
CHROMA_DIR = "./chroma_db_streamlit"
STREAMLIT_APP = "app_streamlit.py"

def print_banner():
    print("=" * 65)
    print("  💧 PATAK: OFFLINE EL NIÑO RESPONSE ASSISTANT - STARTUP  ")
    print("  Local mode: no internet needed | Zero Cloud Dependencies ")
    print("=" * 65)

def check_or_start_ollama():
    """Verify Ollama is reachable; start daemon in background if not."""
    print("[1/4] Checking Ollama daemon status...")
    try:
        res = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        if res.status_code == 200:
            print("  ✓ Ollama daemon is active and responsive.")
            return True
    except Exception:
        pass

    # Try starting Ollama if binary is available
    ollama_bin = shutil.which("ollama")
    if not ollama_bin:
        print("  ⚠️ 'ollama' binary not found in system PATH.")
        print("     Please ensure Ollama is installed from https://ollama.com.")
        print("     Continuing in standalone local mode...")
        return False

    print("  Starting 'ollama serve' in background...")
    try:
        if sys.platform == "win32":
            subprocess.Popen(["ollama", "serve"], creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Poll until daemon is responsive (max 15 seconds)
        for attempt in range(1, 16):
            time.sleep(1)
            try:
                res = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
                if res.status_code == 200:
                    print(f"  ✓ Ollama daemon initialized after {attempt}s.")
                    return True
            except Exception:
                continue
    except Exception as e:
        print(f"  ⚠️ Could not spawn Ollama automatically: {e}")

    print("  ⚠️ Ollama did not respond within 15 seconds. Will use local fallback logic.")
    return False

def check_and_pull_models(ollama_running: bool):
    """Ensure qwen2.5:3b and nomic-embed-text are downloaded."""
    print("[2/4] Verifying required offline models...")
    if not ollama_running:
        print("  Skipping model pulls because Ollama daemon is offline.")
        return

    try:
        res = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        installed_models = []
        if res.status_code == 200:
            installed_models = [m.get("name", "").split(":")[0] for m in res.json().get("models", [])]

        # 1. Check Embedding Model
        if any("nomic-embed-text" in m for m in installed_models):
            print(f"  ✓ Embedding model '{EMBED_MODEL}' is ready.")
        else:
            print(f"  ⬇️ Pulling required embedding model '{EMBED_MODEL}'...")
            subprocess.run(["ollama", "pull", EMBED_MODEL], check=True)
            print(f"  ✓ Successfully installed '{EMBED_MODEL}'.")

        # 2. Check Generation Model
        if any("qwen2.5" in m for m in installed_models):
            print(f"  ✓ Generation model '{LLM_MODEL}' is ready.")
        else:
            print(f"  ⬇️ Pulling required generation model '{LLM_MODEL}'...")
            subprocess.run(["ollama", "pull", LLM_MODEL], check=True)
            print(f"  ✓ Successfully installed '{LLM_MODEL}'.")

    except Exception as e:
        print(f"  ⚠️ Model verification error: {e}. Continuing with existing assets.")

def check_and_populate_chromadb():
    """Verify ChromaDB has records; if not, run built-in ingestion automatically."""
    print("[3/4] Checking local ChromaDB vector store...")
    needs_ingestion = True

    try:
        import chromadb
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        coll = client.get_or_create_collection("elnino_advisories")
        count = coll.count()
        if count > 0:
            print(f"  ✓ ChromaDB is pre-populated with {count} advisory chunks.")
            needs_ingestion = False
        else:
            print("  ChromaDB exists but contains 0 chunks.")
    except Exception as e:
        print(f"  ChromaDB not yet initialized ({e}).")

    if needs_ingestion:
        print("  ⚡ Running automated ingestion of DA, PAGASA, DOH, and DILG advisories...")
        try:
            # Trigger backend/ingest.py or root ingest logic
            ingest_script = "backend/ingest.py" if os.path.exists("backend/ingest.py") else "ingest.py"
            if os.path.exists(ingest_script):
                subprocess.run([sys.executable, ingest_script], check=True)
                print("  ✓ Ingestion complete! Advisories indexed in ChromaDB.")
            else:
                print("  ⚠️ Ingest script not found; will be populated dynamically on app start.")
        except Exception as e:
            print(f"  ⚠️ Automated ingestion encountered warning: {e}")

def launch_streamlit():
    """Launch the Streamlit app seamlessly without needing multiple terminals."""
    print("[4/4] Launching Streamlit application...")
    print(f"  Starting '{STREAMLIT_APP}' in local offline mode...")
    print("=" * 65)

    cmd = [sys.executable, "-m", "streamlit", "run", STREAMLIT_APP, "--server.headless=false"]
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nPatak offline assistant stopped.")

if __name__ == "__main__":
    print_banner()
    ollama_ok = check_or_start_ollama()
    check_and_pull_models(ollama_ok)
    check_and_populate_chromadb()
    launch_streamlit()
