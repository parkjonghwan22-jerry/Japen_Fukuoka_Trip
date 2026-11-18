"""앱 아이콘 3종 생성: 크림 바탕 + "Fuku♥ka". 실행(macOS): python3 tools/make_icons.py"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

NAVY = (31, 58, 95)
RED = (214, 92, 84)
CREAM = (250, 245, 238)
FONT = ("/System/Library/Fonts/Avenir Next.ttc", 2)  # Avenir Next Demi Bold
OUT = Path(__file__).resolve().parent.parent / "icons"
S = 2048  # 크게 그린 뒤 축소


def heart(d, cx, cy, w, color):
    pts = []
    for i in range(240):
        t = i / 240 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * w / 16, cy - y * w / 16))
    d.polygon(pts, fill=color)


def draw(scale, rounded):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=CREAM)
    else:
        d.rectangle([0, 0, S, S], fill=CREAM)

    f = ImageFont.truetype(FONT[0], int(400 * scale), index=FONT[1])
    left, right = "Fuku", "ka"
    bl, br, bo, bx = (d.textbbox((0, 0), t, font=f) for t in (left, right, "o", "x"))
    gap = S * 0.01 * scale
    heart_w = (bo[2] - bo[0]) * 1.15
    total = (bl[2] - bl[0]) + gap + heart_w + gap + (br[2] - br[0])
    x = (S - total) / 2
    top = S / 2 - (bl[3] - bl[1]) / 2  # 글자 높이 기준 세로 가운데
    d.text((x - bl[0], top - bl[1]), left, font=f, fill=NAVY)
    x += (bl[2] - bl[0]) + gap
    x_mid = top + (bx[1] - bl[1]) + (bx[3] - bx[1]) / 2  # 소문자 x 높이의 가운데
    heart(d, x + heart_w / 2, x_mid, heart_w * 0.52, RED)
    x += heart_w + gap
    d.text((x - br[0], top - bl[1]), right, font=f, fill=NAVY)
    return img


def save(img, size, name):
    img.resize((size, size), Image.LANCZOS).save(OUT / name)


OUT.mkdir(exist_ok=True)
save(draw(1.0, True), 192, "icon-192.png")
save(draw(1.0, True), 512, "icon-512.png")
save(draw(0.72, False), 512, "maskable-512.png")  # 원형으로 잘려도 글자가 중앙 80% 안에 들도록 축소
print("ok")
