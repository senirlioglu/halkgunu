"""Halk Günü PWA ikonları üretir (192, 512, apple 180).

Tente logosunu kâğıt zemin (#fef9ed) üzerine bindirir; brand kırmızısı
(#c1272d) ve hardal sarısı (#eab308) ile çizer. Maskable ikon için
tüm ikon güvenli bölgede (%80) kalır.
"""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).parent.parent / "public"
OUT.mkdir(parents=True, exist_ok=True)

PAPER = (254, 249, 237)
RED = (193, 39, 45)
YELLOW = (234, 179, 8)


def draw_tente(img: Image.Image, safe: float = 1.0) -> None:
    """Pazar tezgâhı tentesi — Logo.tsx'in PNG karşılığı.
    `safe` 0..1: maskable için 0.8 → tüm logo iç %80'de kalır.
    """
    draw = ImageDraw.Draw(img)
    w, h = img.size
    # 40x40 viewBox'u uygula, safe ile küçült
    s = min(w, h) * safe
    ox = (w - s) / 2
    oy = (h - s) / 2

    def pt(x: float, y: float) -> tuple[int, int]:
        return (int(ox + x * s / 40), int(oy + y * s / 40))

    # Üst trapez (kırmızı): M4 13 L20 5 L36 13 L36 17 L4 17 Z
    draw.polygon(
        [pt(4, 13), pt(20, 5), pt(36, 13), pt(36, 17), pt(4, 17)],
        fill=RED,
    )
    # 3 dikey şerit (sarı / kırmızı / sarı), y=17, h=18
    draw.rectangle([pt(6, 17), pt(12, 35)], fill=YELLOW)
    draw.rectangle([pt(17, 17), pt(23, 35)], fill=RED)
    draw.rectangle([pt(28, 17), pt(34, 35)], fill=YELLOW)
    # Alt taban (kırmızı): x=6 y=33 w=28 h=3
    draw.rectangle([pt(6, 33), pt(34, 36)], fill=RED)


def make(size: int, filename: str, *, maskable: bool = False) -> None:
    img = Image.new("RGB", (size, size), PAPER)
    draw_tente(img, safe=0.78 if maskable else 1.0)
    path = OUT / filename
    img.save(path, format="PNG", optimize=True)
    print(f"  → {path.relative_to(Path(__file__).parent.parent)} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    make(192, "icon-192.png")
    make(512, "icon-512.png")
    make(180, "apple-touch-icon.png")
    make(512, "icon-maskable-512.png", maskable=True)
    make(32, "favicon-32.png")
    print("Done.")
