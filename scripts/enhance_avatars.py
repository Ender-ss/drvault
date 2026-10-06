import os
import glob
from PIL import Image, ImageFilter, ImageEnhance

AVATAR_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "avatar-images")
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "avatar-images-backup")
os.makedirs(BACKUP_DIR, exist_ok=True)

files = glob.glob(os.path.join(AVATAR_DIR, "*.png"))
print(f"Encontrados {len(files)} avatares para aprimorar.")

for f in files:
    filename = os.path.basename(f)
    backup_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy2(f, backup_path)

    img = Image.open(f)
    w, h = img.size

    # Target 3x upscale with Lanczos
    new_w, new_h = w * 3, h * 3
    upscaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Convert to RGB if RGBA without transparency
    if upscaled.mode == 'RGBA':
        # Check if alpha is fully opaque
        alpha = upscaled.split()[-1]
        if alpha.getextrema() == (255, 255):
            upscaled = upscaled.convert('RGB')

    # Apply UnsharpMask to restore facial edge definition
    sharpened = upscaled.filter(ImageFilter.UnsharpMask(radius=2.2, percent=140, threshold=2))

    # Slightly enhance contrast and sharpness
    enhancer_contrast = ImageEnhance.Contrast(sharpened)
    sharpened = enhancer_contrast.enhance(1.08)

    enhancer_sharp = ImageEnhance.Sharpness(sharpened)
    final_img = enhancer_sharp.enhance(1.2)

    final_img.save(f, format="PNG", optimize=True)
    print(f"  [OK] {filename}: {w}x{h} -> {new_w}x{new_h}")

print("Todos os avatares foram aprimorados e salvos com sucesso!")
