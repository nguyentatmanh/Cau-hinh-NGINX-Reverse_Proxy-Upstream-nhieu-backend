#!/usr/bin/env python3
"""
generate_sample_images.py
Sinh ra các tệp ảnh PNG thực tế, có thể hiển thị và giải mã 100% trong mọi trình duyệt.
- sample_cover_small.png: ~250 KB (hợp lệ cho giới hạn 1MB)
- sample_cover_large.png: ~2.1 MB (vượt quá giới hạn 1MB -> kích hoạt lỗi 413 của NGINX, sau đó nạp nóng 20M để upload thành công)
"""
import os
import math
import random
from PIL import Image, ImageDraw

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "frontend", "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

def generate_cover(filename, width, height, title, subtitle, is_large=False):
    img = Image.new("RGB", (width, height), color=(16, 54, 114))
    draw = ImageDraw.Draw(img)

    # 1. Gradient nền học thuật HUCE
    for y in range(height):
        factor = y / height
        r = int(16 + (30 - 16) * factor)
        g = int(54 + (100 - 54) * factor)
        b = int(114 + (186 - 114) * factor)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # 2. Khung viền và họa tiết hình học
    margin = int(width * 0.05)
    draw.rectangle([margin, margin, width - margin, height - margin], outline=(255, 255, 255), width=max(4, int(width * 0.006)))

    # 3. Vẽ các dải sóng công nghệ
    for i in range(25):
        points = []
        phase = i * 0.4
        for x in range(margin, width - margin, 8):
            y_base = height * 0.52 + i * (height * 0.016)
            y = y_base + math.sin(x * 0.008 + phase) * (height * 0.025)
            points.append((x, y))
        draw.line(points, fill=(14, 165, 233), width=3)

    # 4. Tiêu đề trường & khoa
    draw.text((margin + 30, margin + 40), "TRUONG DAI HOC XAY DUNG HA NOI", fill=(255, 255, 255))
    draw.text((margin + 30, margin + 85), "KHOA CONG NGHE THONG TIN - HUCE LEARNING STORE", fill=(224, 242, 254))

    # 5. Tiêu đề sách / khóa học chính
    card_top = int(height * 0.20)
    card_bottom = int(height * 0.42)
    draw.rectangle([margin + 30, card_top, width - margin - 30, card_bottom], fill=(10, 37, 80))
    draw.text((margin + 60, card_top + 40), title, fill=(255, 255, 255))
    draw.text((margin + 60, card_top + 100), subtitle, fill=(56, 189, 248))

    # 6. Thông tin nhóm thực hiện
    draw.text((margin + 60, height - margin - 90), "NHOM 8 - HE THONG SERVER NANG CAO", fill=(203, 213, 225))
    draw.text((margin + 60, height - margin - 50), "Ha Noi, thang 10 nam 2026", fill=(148, 163, 184))

    # 7. Đối với ảnh large (>1MB): Tạo hoa văn gradient lưới pixel phức hợp để đạt dung lượng nén ~2.1MB chuẩn xác
    if is_large:
        random.seed(2026)
        # Tạo lưới sóng và hạt texture vi mô tự nhiên dày đặc
        for y in range(int(height * 0.35), int(height * 0.92), 2):
            for x in range(margin + 10, width - margin - 10, 2):
                val = int((math.sin(x * 0.04) + math.cos(y * 0.04) + math.sin((x+y)*0.025)) * 60)
                noise = random.randint(-45, 45)
                cr = max(0, min(255, 40 + val + noise))
                cg = max(0, min(255, 90 + val + noise))
                cb = max(0, min(255, 170 + val + noise))
                draw.point((x, y), fill=(cr, cg, cb))

    out_path = os.path.join(ASSETS_DIR, filename)
    img.save(out_path, format="PNG", compress_level=6)
    actual_size = os.path.getsize(out_path)
    print(f"[OK] Da tao '{filename}': {width}x{height} - Dung luong: {actual_size / (1024*1024):.2f} MB ({actual_size:,} bytes)")
    return out_path

if __name__ == "__main__":
    generate_cover(
        "sample_cover_small.png",
        800, 1100,
        "GIAO TRINH NGINX REVERSE PROXY",
        "Kien truc Phan tan & Can bang tai",
        is_large=False
    )

    generate_cover(
        "sample_cover_large.png",
        2000, 2600,
        "QUAN TRI SERVER NANG CAO & NGINX CLUSTER",
        "Ban dac biet phuc vu Demo HTTP 413 Request Body Limit",
        is_large=True
    )
