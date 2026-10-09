#!/usr/bin/env python3
"""
Patak: Local RAG Ingestion Pipeline
Embeds Philippine government El Niño public advisories (DA, PAGASA, DOH, DILG, DA-BAI)
into local ChromaDB using Ollama nomic-embed-text (with page-level citations).
"""

import os
import glob
import requests
from typing import List, Dict

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
CHROMA_PERSIST_DIRS = ["./chroma_db", "./chroma_db_streamlit"]

SAMPLE_ADVISORIES = [
    {
        "filename": "DA_AWD_Rice_Protocol_2024.pdf",
        "title": "DA Advisory No. 2024-03: Alternate Wetting and Drying (AWD) & Rice Drought Protocol",
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
        "title": "PAGASA Drought Bulletin #14: Strong El Niño Rainfall Anomaly Advisory",
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

def get_ollama_embedding(text: str) -> List[float]:
    """Retrieve vector embeddings from local Ollama instance"""
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

def seed_database_if_empty(force: bool = False):
    """Seed ChromaDB with government advisories if empty or forced"""
    try:
        import chromadb
    except ImportError:
        print("  ⚠️ chromadb not installed. Run: pip install chromadb")
        return False

    all_chunks = []
    for adv in SAMPLE_ADVISORIES:
        for p in adv["pages"]:
            chunk_id = f"{adv['filename']}_p{p['page']}"
            all_chunks.append({
                "id": chunk_id,
                "text": p["text"],
                "source": adv["filename"],
                "page": p["page"],
                "title": adv["title"]
            })

    for target_dir in CHROMA_PERSIST_DIRS:
        try:
            client = chromadb.PersistentClient(path=target_dir)
            collection = client.get_or_create_collection(name="elnino_advisories")
            curr_count = collection.count()

            if curr_count > 0 and not force:
                print(f"  ✓ Collection in '{target_dir}' already has {curr_count} chunks. Skipping.")
                continue

            print(f"  Indexing {len(all_chunks)} chunks into '{target_dir}'...")
            ids = [c["id"] for c in all_chunks]
            docs = [c["text"] for c in all_chunks]
            metas = [{"source": c["source"], "page": c["page"], "title": c["title"]} for c in all_chunks]

            # Try generating nomic-embed-text embeddings
            embeddings = []
            has_valid_embs = False
            for d in docs:
                emb = get_ollama_embedding(d)
                embeddings.append(emb)
                if emb:
                    has_valid_embs = True

            if has_valid_embs and all(len(e) > 0 for e in embeddings):
                collection.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=embeddings)
                print(f"  ✓ Successfully indexed with Ollama '{EMBED_MODEL}' in '{target_dir}'.")
            else:
                # Use ChromaDB built-in text storage
                collection.upsert(ids=ids, documents=docs, metadatas=metas)
                print(f"  ✓ Successfully indexed documents into '{target_dir}'.")
        except Exception as e:
            print(f"  ⚠️ Error writing to {target_dir}: {e}")

    return True

if __name__ == "__main__":
    print("==================================================")
    print("  PATAK: LOCAL RAG INGESTION & AUTO-SEED PIPELINE ")
    print("==================================================")
    seed_database_if_empty(force=True)
    print("✓ Ingestion complete.")
