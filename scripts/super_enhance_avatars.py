import glob
import os
import time
import io
import urllib.request
from PIL import Image, ImageFilter, ImageEnhance

def enhance_and_sharpen(img, target_min=1000):
    w, h = img.size
    # Determine scale factor so min dimension is at least target_min
    cur_min = min(w, h)
    if cur_min < target_min:
        scale = max(2.0, target_min / float(cur_min))
        new_w = int(round(w * scale))
        new_h = int(round(h * scale))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Apply subtle unsharp mask to make edges crisp
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=2))
    # Enhance contrast slightly (1.05)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    # Enhance sharpness slightly (1.1)
    img = ImageEnhance.Sharpness(img).enhance(1.1)
    return img

def download_with_retry(url, user_agent="DRVaultMediaBot/2.0 (webmaster@drvault.com)"):
    req = urllib.request.Request(url, headers={'User-Agent': user_agent})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                return Image.open(io.BytesIO(res.read())).convert('RGB')
        except Exception as e:
            print(f"  Attempt {attempt+1} failed for {url}: {e}")
            time.sleep(2)
    return None

def main():
    avatar_dir = 'public/avatar-images'
    
    # 1. Specific ultra high-res portrait replacements
    replacements = {
        'gupta_1.png': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Sanjay_Gupta_%28cropped%29.jpg',
        'gupta_2.png': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Sanjay_Gupta.jpg',
        'mel_gibson.png': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Mel_Gibson_in_Singapore.jpg',
        'gina.png': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Gina_Carano_by_Gage_Skidmore.jpg',
        'yellowstone_velho.png': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Kevin_Costner_2016.jpg'
    }
    
    for filename, url in replacements.items():
        filepath = os.path.join(avatar_dir, filename)
        print(f"Fetching HD replacement for {filename}...")
        img = download_with_retry(url)
        if img:
            # save optimized
            img = enhance_and_sharpen(img, target_min=1000)
            img.save(filepath, 'PNG', optimize=True)
            print(f"  -> Successfully replaced {filename} with HD image: {img.size}")
        time.sleep(1)

    # 2. Process all existing images to ensure minimum quality & sharpness
    for filepath in glob.glob(os.path.join(avatar_dir, '*.png')):
        filename = os.path.basename(filepath)
        try:
            with Image.open(filepath) as img:
                img = img.convert('RGB')
                w, h = img.size
                if min(w, h) < 1000:
                    print(f"Upscaling and sharpening {filename} (was {w}x{h})...")
                    enhanced = enhance_and_sharpen(img, target_min=1000)
                    enhanced.save(filepath, 'PNG', optimize=True)
                    print(f"  -> Now: {enhanced.size}")
                else:
                    print(f"Keeping high-res {filename}: {w}x{h}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == '__main__':
    main()
