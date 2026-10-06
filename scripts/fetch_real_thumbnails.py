import os
import sys
import json
import re
import time
import ssl
import urllib.request
import urllib.parse
from PIL import Image
import io

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "thumbnails")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DATA_FILE = os.path.join(BASE_DIR, "src", "data", "google_doc_media.ts")

CRAWLER_HEADERS = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
}

TWITTER_HEADERS = {
    'User-Agent': 'Twitterbot/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
}

def download_and_save_image(img_url: str, dest_path: str) -> bool:
    """Downloads an image from URL and saves as optimized JPEG."""
    try:
        req = urllib.request.Request(img_url, headers=BROWSER_HEADERS)
        resp = urllib.request.urlopen(req, context=ctx, timeout=12)
        content_bytes = resp.read()
        if len(content_bytes) < 1000:
            return False
        
        # Verify it's an image
        img = Image.open(io.BytesIO(content_bytes))
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Save optimized JPEG
        img.save(dest_path, "JPEG", quality=88, optimize=True)
        return True
    except Exception as e:
        # print(f"  [Erro ao baixar imagem]: {e}")
        return False

def get_instagram_thumb_url(link: str) -> str:
    """Attempts multiple methods to extract Instagram thumbnail URL."""
    # Method 1: facebookexternalhit crawler (find og:image)
    try:
        req = urllib.request.Request(link, headers=CRAWLER_HEADERS)
        resp = urllib.request.urlopen(req, context=ctx, timeout=8)
        html = resp.read().decode('utf-8', errors='ignore')
        m = re.search(r'property="og:image"\s+content="([^"]+)"', html) or re.search(r'content="([^"]+)"\s+property="og:image"', html)
        if m:
            img_url = m.group(1).replace('&amp;', '&')
            if img_url.startswith('http'):
                return img_url
    except Exception:
        pass

    # Method 2: shortcode media endpoint
    m_code = re.search(r'/(?:p|reel|reels)/([A-Za-z0-9_-]+)', link)
    if m_code:
        code = m_code.group(1)
        media_url = f"https://www.instagram.com/p/{code}/media/?size=l"
        try:
            req = urllib.request.Request(media_url, headers=BROWSER_HEADERS)
            resp = urllib.request.urlopen(req, context=ctx, timeout=8)
            real_url = resp.geturl()
            if real_url and 'cdninstagram.com' in real_url or 'fbcdn.net' in real_url:
                return real_url
        except Exception:
            pass

    # Method 3: twitterbot
    try:
        req = urllib.request.Request(link, headers=TWITTER_HEADERS)
        resp = urllib.request.urlopen(req, context=ctx, timeout=8)
        html = resp.read().decode('utf-8', errors='ignore')
        m = re.search(r'name="twitter:image"\s+content="([^"]+)"', html) or re.search(r'content="([^"]+)"\s+name="twitter:image"', html)
        if m:
            img_url = m.group(1).replace('&amp;', '&')
            if img_url.startswith('http'):
                return img_url
    except Exception:
        pass

    return ""

def get_tiktok_thumb_url(link: str) -> str:
    """Attempts multiple methods to extract TikTok thumbnail URL."""
    # Method 1: facebookexternalhit crawler
    try:
        req = urllib.request.Request(link, headers=CRAWLER_HEADERS)
        resp = urllib.request.urlopen(req, context=ctx, timeout=8)
        html = resp.read().decode('utf-8', errors='ignore')
        m = re.search(r'property="og:image"\s+content="([^"]+)"', html) or re.search(r'content="([^"]+)"\s+property="og:image"', html)
        if m:
            img_url = m.group(1).replace('&amp;', '&')
            if img_url.startswith('http'):
                return img_url
    except Exception:
        pass

    # Method 2: Twitterbot
    try:
        req = urllib.request.Request(link, headers=TWITTER_HEADERS)
        resp = urllib.request.urlopen(req, context=ctx, timeout=8)
        html = resp.read().decode('utf-8', errors='ignore')
        m = re.search(r'name="twitter:image"\s+content="([^"]+)"', html) or re.search(r'content="([^"]+)"\s+name="twitter:image"', html)
        if m:
            img_url = m.group(1).replace('&amp;', '&')
            if img_url.startswith('http'):
                return img_url
    except Exception:
        pass

    # Method 3: oEmbed API
    try:
        oembed_url = f"https://www.tiktok.com/oembed?url={urllib.parse.quote(link)}"
        req = urllib.request.Request(oembed_url, headers=BROWSER_HEADERS)
        resp = urllib.request.urlopen(req, context=ctx, timeout=8)
        data = json.loads(resp.read().decode('utf-8'))
        t_url = data.get('thumbnail_url')
        if t_url:
            return t_url
    except Exception:
        pass

    return ""

def get_youtube_thumb_url(link: str) -> str:
    """Extracts YouTube thumbnail URL."""
    m = re.search(r'(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{11})', link)
    if m:
        video_id = m.group(1)
        return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    return ""

def main():
    print(f"[DRVault] Carregando {DATA_FILE}...")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r'export const googleDocMediaItems: MediaItem\[\] = (\[\s*\{.*\}\s*\]);?', content, re.DOTALL)
    if not match:
        print("[ERRO] Nao foi possivel fazer o parse do array googleDocMediaItems!")
        return

    items = json.loads(match.group(1))
    print(f"[DRVault] Total de {len(items)} itens encontrados.")

    success_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, item in enumerate(items, start=1):
        item_id = item.get("id")
        title = item.get("title", "")
        drive_link = item.get("driveLink", "")
        dest_filename = f"{item_id}.jpg"
        dest_path = os.path.join(OUTPUT_DIR, dest_filename)
        public_url = f"/thumbnails/{dest_filename}"

        print(f"\n[{idx}/{len(items)}] {title[:50]}...")

        # If already downloaded and valid, keep it
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 2000:
            print(f"  -> Ja existe localmente: {dest_filename}")
            item["thumbUrl"] = public_url
            success_count += 1
            continue

        raw_thumb_url = ""
        if "instagram.com" in drive_link:
            print(f"  -> Buscando thumbnail no Instagram ({drive_link[:45]}...)")
            raw_thumb_url = get_instagram_thumb_url(drive_link)
        elif "tiktok.com" in drive_link:
            print(f"  -> Buscando thumbnail no TikTok ({drive_link[:45]}...)")
            raw_thumb_url = get_tiktok_thumb_url(drive_link)
        elif "youtube.com" in drive_link or "youtu.be" in drive_link:
            print(f"  -> Buscando thumbnail no YouTube")
            raw_thumb_url = get_youtube_thumb_url(drive_link)
        elif "drive.google.com" in drive_link:
            m_drive = re.search(r'/file/d/([A-Za-z0-9_-]+)', drive_link) or re.search(r'id=([A-Za-z0-9_-]+)', drive_link)
            if m_drive:
                raw_thumb_url = f"https://drive.google.com/thumbnail?id={m_drive.group(1)}&sz=w600"

        if raw_thumb_url:
            print(f"  -> URL encontrada! Baixando...")
            ok = download_and_save_image(raw_thumb_url, dest_path)
            if ok:
                item["thumbUrl"] = public_url
                print(f"  [SUCESSO] Salva em {public_url}")
                success_count += 1
                time.sleep(0.3)
                continue
            else:
                print(f"  [AVISO] Falha ao fazer download da imagem.")

        # Fallback if download failed or not a social media link
        if not drive_link.startswith("http"):
            print("  -> Link local/interno, mantendo.")
            skipped_count += 1
        else:
            print("  [FALHA] Nao foi possivel obter thumbnail real.")
            failed_count += 1

    print("\n" + "="*50)
    print(f"RESUMO: {success_count} obtidas/atualizadas, {failed_count} falhas, {skipped_count} ignoradas.")
    print("="*50)

    # Write back to google_doc_media.ts
    new_json_str = json.dumps(items, ensure_ascii=False, indent=2)
    new_content = f"import {{ type MediaItem }} from './mock'\n\nexport const googleDocMediaItems: MediaItem[] = {new_json_str}\n"

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"[DRVault] Arquivo {DATA_FILE} atualizado com sucesso!")

if __name__ == "__main__":
    main()
