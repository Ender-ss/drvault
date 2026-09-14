#!/usr/bin/env python3
"""
DRVault Vision Agent
Agente de Leitura Visual com Google Gemini Vision (gemini-3-flash-preview).
Processa thumbnails de criativos na biblioteca com rate-limiting seguro para tier gratuito (5.5s de intervalo),
gerando visual_description, scene_summary e tags inteligentes no PostgreSQL (Supabase).
"""

import os
import sys
import time
import json
import base64
import io
import re
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from PIL import Image

# Load configuration from environment or local unversioned config file
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.vision")
def get_config_val(key_name, default=""):
    val = os.environ.get(key_name)
    if val:
        return val
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith(f"{key_name}="):
                    return line.strip().split("=", 1)[1].strip("\"'")
    return default

API_KEY = get_config_val("GEMINI_API_KEY")
MODEL = get_config_val("GEMINI_MODEL", "gemini-3-flash-preview")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

DB_HOST = get_config_val("DB_HOST", "127.0.0.1")
DB_PORT = int(get_config_val("DB_PORT", "54322"))
DB_USER = get_config_val("DB_USER", "supabase_admin")
DB_PASS = get_config_val("DB_PASS")
DB_NAME = get_config_val("DB_NAME", "postgres")

STATUS_FILE = "/var/www/drvault/public/vision_agent_status.json"
BASE_PUBLIC_DIR = "/var/www/drvault/public"

# Rate limiting: 5.5 seconds between requests = ~10.9 RPM (Safe under 15 RPM limit)
RATE_LIMIT_DELAY = 5.5

PROMPT_TEMPLATE = """
Você é o Agente Especialista em Leitura Visual de Criativos e Anúncios de Vídeo para Direct Response (DRVault).
Analise com precisão visual a imagem fornecida (thumbnail de vídeo/anúncio) e descreva o que está acontecendo na cena.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem blocos ```json) com a seguinte estrutura:
{
  "visual_description": "Descrição detalhada em português (2 a 4 frases) da cena: pessoas, partes do corpo, ações sendo executadas (ex: despejando bicarbonato de sódio no pé, cortando cebola, pingando líquido nos olhos, apontando para gráfico), produtos/ingredientes, recipientes, expressões e textos visíveis.",
  "scene_summary": "Resumo de 1 frase concisa da cena",
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "detected_elements": ["elemento1", "elemento2", "elemento3"]
}
"""

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME
    )

def update_status(total, processed, remaining, last_title=None, is_running=True, error=None):
    try:
        data = {
            "total": total,
            "processed": processed,
            "remaining": remaining,
            "progress_percent": round((processed / total * 100), 1) if total > 0 else 0,
            "last_analyzed_title": last_title,
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "status": "running" if is_running else "idle",
            "error": error
        }
        os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)
        with open(STATUS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Aviso] Falha ao atualizar status JSON: {e}")

def load_and_optimize_image(thumb_url, drive_link=None):
    """
    Carrega a imagem de caminho local ou URL externa e converte para JPEG 512px otimizado.
    """
    img = None
    try:
        # 1. Caminho local (/media_extracted/... ou /avatar-images/...)
        if thumb_url and (thumb_url.startswith("/media_extracted/") or thumb_url.startswith("/avatar-images/")):
            local_path = os.path.join(BASE_PUBLIC_DIR, thumb_url.lstrip("/"))
            if os.path.exists(local_path):
                img = Image.open(local_path)

        # 2. URL Externa HTTP/HTTPS
        elif thumb_url and thumb_url.startswith("http"):
            headers = {"User-Agent": "Mozilla/5.0"}
            resp = requests.get(thumb_url, headers=headers, timeout=12)
            if resp.status_code == 200:
                img = Image.open(io.BytesIO(resp.content))

        # 3. Fallback para YouTube Thumbnail se houver link
        if img is None and drive_link:
            yt_match = re.search(r'(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)', drive_link)
            if yt_match:
                yt_id = yt_match.group(1)
                yt_thumb = f"https://img.youtube.com/vi/{yt_id}/hqdefault.jpg"
                resp = requests.get(yt_thumb, timeout=10)
                if resp.status_code == 200:
                    img = Image.open(io.BytesIO(resp.content))

        if img is None:
            return None

        # Converte para RGB e redimensiona para 512px máx
        img = img.convert("RGB")
        img.thumbnail((512, 512), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    except Exception as e:
        print(f"Erro ao carregar imagem ({thumb_url}): {e}")
        return None

def analyze_image_with_gemini(img_b64):
    """
    Envia a imagem para a API Gemini com retry em caso de indisponibilidade temporária.
    """
    payload = {
        "contents": [{
            "parts": [
                {"text": PROMPT_TEMPLATE},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            r = requests.post(GEMINI_URL, json=payload, timeout=25)
            if r.status_code == 200:
                data = r.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Limpa eventuais marcadores de markdown
                if text.startswith("```"):
                    text = re.sub(r"^```(?:json)?\n", "", text)
                    text = re.sub(r"\n```$", "", text)
                return json.loads(text)
            elif r.status_code in [429, 503]:
                wait_time = 15 * (attempt + 1)
                print(f"[Rate Limit / 503] Aguardando {wait_time}s antes de retentar...")
                time.sleep(wait_time)
            else:
                print(f"[Erro Gemini {r.status_code}]: {r.text[:200]}")
                return None
        except Exception as e:
            print(f"[Tentativa {attempt+1} Exceção]: {e}")
            time.sleep(5)

    return None

def process_pending_items():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Consulta total geral e itens pendentes
    cursor.execute("SELECT count(*) as total FROM media_items;")
    total_items = cursor.fetchone()["total"]

    cursor.execute("SELECT count(*) as analyzed FROM media_items WHERE visual_description IS NOT NULL;")
    already_analyzed = cursor.fetchone()["analyzed"]

    cursor.execute("""
        SELECT id, title, thumb_url, drive_link, tags
        FROM media_items 
        WHERE visual_description IS NULL
        ORDER BY created_at DESC;
    """)
    pending = cursor.fetchall()
    remaining = len(pending)

    print(f"\n==========================================")
    print(f"DRVault Vision Agent Iniciado")
    print(f"Total no Banco: {total_items} | Já Analisados: {already_analyzed} | Pendentes: {remaining}")
    print(f"==========================================\n")

    update_status(total_items, already_analyzed, remaining, is_running=True)

    if not pending:
        print("Nenhum item pendente no momento.")
        update_status(total_items, total_items, 0, is_running=False)
        conn.close()
        return

    processed_in_this_run = 0

    for idx, item in enumerate(pending, start=1):
        item_id = item["id"]
        title = item["title"]
        thumb_url = item["thumb_url"]
        drive_link = item["drive_link"]
        current_tags = set(item["tags"] or [])

        print(f"[{idx}/{remaining}] Analisando: '{title}'...")

        img_b64 = load_and_optimize_image(thumb_url, drive_link)
        if not img_b64:
            print(f"  -> Thumbnail indisponível ou inválida, marcando descrição vazia.")
            cursor.execute("UPDATE media_items SET visual_description = %s WHERE id = %s;", ("[Thumbnail indisponível]", item_id))
            conn.commit()
            continue

        analysis = analyze_image_with_gemini(img_b64)
        if analysis:
            visual_desc = analysis.get("visual_description", "")
            scene_sum = analysis.get("scene_summary", "")
            suggested_tags = analysis.get("suggested_tags", [])

            # Une tags existentes com as novas sugeridas pela IA (evitando duplicatas)
            new_tags = list(current_tags.union(set(suggested_tags)))

            cursor.execute("""
                UPDATE media_items 
                SET visual_description = %s, 
                    scene_summary = %s,
                    tags = %s
                WHERE id = %s;
            """, (visual_desc, scene_sum, new_tags, item_id))
            conn.commit()

            already_analyzed += 1
            remaining -= 1
            processed_in_this_run += 1

            print(f"  ✓ IA: {scene_sum[:80]}...")
            print(f"  ✓ Tags adicionadas: {', '.join(suggested_tags[:4])}")

            update_status(total_items, already_analyzed, remaining, last_title=title, is_running=True)
        else:
            print(f"  ✕ Falha na resposta da IA para o item {item_id}.")

        # Intervalo seguro para tier gratuito
        time.sleep(RATE_LIMIT_DELAY)

    print(f"\n✓ Ciclo concluído! {processed_in_this_run} criativos analisados e enriquecidos com sucesso.")
    update_status(total_items, already_analyzed, remaining, is_running=False)
    conn.close()

if __name__ == "__main__":
    try:
        process_pending_items()
    except KeyboardInterrupt:
        print("\nAgente interrompido pelo usuário.")
        sys.exit(0)
    except Exception as e:
        print(f"\nErro fatal no agente: {e}")
        update_status(0, 0, 0, is_running=False, error=str(e))
        sys.exit(1)
