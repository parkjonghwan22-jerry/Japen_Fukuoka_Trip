"""앱에 넣을 사진 준비: 회전 보정 → 축소 → 위치정보 등 메타데이터 제거.
실행: python3 tools/prepare_photo.py <원본 경로> [이름=main]
결과: photos/<이름>.jpg (긴 변 1440px), photos/<이름>-thumb.jpg (긴 변 240px)
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

OUT = Path(__file__).resolve().parent.parent / "photos"


def export(img, long_edge, path):
    im = img.copy()
    im.thumbnail((long_edge, long_edge), Image.LANCZOS)
    # exif 인자를 주지 않으면 메타데이터 없이 저장된다
    im.save(path, "JPEG", quality=82, optimize=True, progressive=True)


def main():
    src = Path(sys.argv[1])
    name = sys.argv[2] if len(sys.argv) > 2 else "main"
    OUT.mkdir(exist_ok=True)
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    export(img, 1440, OUT / f"{name}.jpg")
    export(img, 240, OUT / f"{name}-thumb.jpg")
    print(img.size, "->", OUT / f"{name}.jpg")


if __name__ == "__main__":
    main()
