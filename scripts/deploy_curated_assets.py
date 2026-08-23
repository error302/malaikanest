import os
import shutil
import urllib.request

BRAIN_DIR = r"C:\Users\user\.gemini\antigravity\brain\d798f6cf-2ff5-4fae-b9e0-a3da3cd98c7b"
AGES_DIR = r"c:\Users\user\Desktop\malaikanest\frontend\public\images\ages"
CATS_DIR = r"c:\Users\user\Desktop\malaikanest\frontend\public\images\categories"

os.makedirs(AGES_DIR, exist_ok=True)
os.makedirs(CATS_DIR, exist_ok=True)

# 1. Copy generated Kenyan Baby & Toddler Images
generated_mapping = {
    "kenyan_newborn_avatar_1787098163358.jpg": "newborn.jpg",
    "kenyan_0_3m_avatar_1787098209282.jpg": "0-3m.jpg",
    "kenyan_3_6m_avatar_1787098255815.jpg": "3-6m.jpg",
    "kenyan_6_9m_avatar_1787098306713.jpg": "6-9m.jpg",
    "kenyan_9_12m_avatar_1787098361258.jpg": "9-12m.jpg",
    "kenyan_1_2y_avatar_1787098420667.jpg": "1-2y.jpg",
}

for src_name, dst_name in generated_mapping.items():
    src_path = os.path.join(BRAIN_DIR, src_name)
    if os.path.exists(src_path):
        dst_path = os.path.join(AGES_DIR, dst_name)
        shutil.copy2(src_path, dst_path)
        print(f"Copied generated Kenyan avatar: {dst_name}")

# 2. Curated High-Res URLs for remaining Kenyan children & Categories
download_urls = {
    # Ages
    os.path.join(AGES_DIR, "2-4y.jpg"): "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=600&auto=format&fit=crop&q=80",
    os.path.join(AGES_DIR, "4-6y.jpg"): "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    os.path.join(AGES_DIR, "6-9y.jpg"): "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&auto=format&fit=crop&q=80",
    os.path.join(AGES_DIR, "9-12y.jpg"): "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
    # Categories
    os.path.join(CATS_DIR, "baby-clothing.jpg"): "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "clothing.jpg"): "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "baby-essentials.jpg"): "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "nursery.jpg"): "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "nursery-gear.jpg"): "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "toys.jpg"): "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "toys-gifts.jpg"): "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "gifts.jpg"): "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "travel.jpg"): "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&auto=format&fit=crop&q=80",
    os.path.join(CATS_DIR, "thrifted.jpg"): "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80",
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for target_path, url in download_urls.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp, open(target_path, 'wb') as f:
            f.write(resp.read())
        print(f"Downloaded: {os.path.basename(target_path)}")
    except Exception as e:
        print(f"Error downloading {target_path}: {e}")

print("All curated assets deployed successfully!")
