"""앱 아이콘 3종 생성: 남색 배경 + 빨간 지도 핀. 실행: python3 tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

NAVY = (31, 58, 95)
RED = (200, 66, 59)
WHITE = (255, 255, 255)
OUT = Path(__file__).resolve().parent.parent / "icons"


def draw_icon(size, scale, rounded):
    s = size * 4  # 4배로 그린 뒤 축소해 가장자리를 부드럽게
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=NAVY)
    else:
        d.rectangle([0, 0, s, s], fill=NAVY)
    cx, cy = s / 2, s / 2
    r = s * 0.22 * scale  # 핀 머리 반지름
    head_cy = cy - r * 0.45
    tip_y = head_cy + r * 2.25
    d.ellipse([cx - r, head_cy - r, cx + r, head_cy + r], fill=RED)
    d.polygon([(cx - r * 0.82, head_cy + r * 0.55), (cx + r * 0.82, head_cy + r * 0.55), (cx, tip_y)], fill=RED)
    hr = r * 0.42
    d.ellipse([cx - hr, head_cy - hr, cx + hr, head_cy + hr], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(exist_ok=True)
draw_icon(192, 1.0, True).save(OUT / "icon-192.png")
draw_icon(512, 1.0, True).save(OUT / "icon-512.png")
draw_icon(512, 0.75, False).save(OUT / "maskable-512.png")  # 안전 영역(중앙 80%) 안에 그림
print("ok")
