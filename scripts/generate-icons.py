#!/usr/bin/env python3
"""
Generate every brand asset (toolbar icons, store icon, banner, promo tiles)
from the single source logo at assets/source/nav_bar_icon.png.

The source logo is a white mark on a transparent background, so we place it on
a rounded gradient tile. Requires: pip install pillow
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source" / "nav_bar_icon.png"
ICONS = ROOT / "assets" / "icons"
STORE = ROOT / "assets" / "store"

BRAND = ((79, 70, 229), (6, 182, 212))      # indigo -> cyan
OFF = ((107, 114, 128), (156, 163, 175))    # grey (paused / disabled)
DARK = ((11, 16, 32), (49, 46, 129))        # banner background

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def font(size):
    for p in FONT_CANDIDATES:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def load_logo():
    im = Image.open(SRC).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h))
    px = img.load()
    denom = max(1, (w - 1) + (h - 1))
    for y in range(h):
        for x in range(w):
            t = (x + y) / denom
            px[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return img


def tile(size, colors, logo, logo_scale=0.60):
    """Rounded gradient square with the logo centred on it."""
    big = 512
    bg = gradient(big, big, *colors).convert("RGBA")
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.22), fill=255)
    bg.putalpha(mask)

    lw, lh = logo.size
    k = (big * logo_scale) / max(lw, lh)
    mark = logo.resize((max(1, int(lw * k)), max(1, int(lh * k))), Image.LANCZOS)
    bg.alpha_composite(mark, ((big - mark.width) // 2, (big - mark.height) // 2))
    return bg.resize((size, size), Image.LANCZOS)


def banner(w, h, logo, title="Summit Block", tagline="Fast, private, open-source ad & tracker blocking"):
    img = gradient(w, h, *DARK).convert("RGBA")
    icon_size = int(h * 0.56)
    icon = tile(icon_size, BRAND, logo)
    pad = int(h * 0.12)
    img.alpha_composite(icon, (pad + int(w * 0.04), (h - icon_size) // 2))
    d = ImageDraw.Draw(img)
    tx = pad + int(w * 0.04) + icon_size + int(h * 0.12)
    d.text((tx, int(h * 0.30)), title, font=font(int(h * 0.17)), fill=(255, 255, 255, 255))
    d.text((tx, int(h * 0.30) + int(h * 0.24)), tagline, font=font(int(h * 0.062)), fill=(165, 180, 252, 255))
    return img.convert("RGB")


def main():
    ICONS.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)
    logo = load_logo()

    for s in (16, 32, 48, 128, 256, 512):
        tile(s, BRAND, logo).save(ICONS / f"icon-{s}.png")
    for s in (16, 32, 48, 128):
        tile(s, OFF, logo).save(ICONS / f"icon-off-{s}.png")

    # transparent white mark (useful for dark UIs)
    side = 512
    k = side * 0.9 / max(logo.size)
    mark = logo.resize((int(logo.width * k), int(logo.height * k)), Image.LANCZOS)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    canvas.save(ROOT / "assets" / "logo-white.png")

    tile(512, BRAND, logo).save(ROOT / "assets" / "logo.png")
    banner(1280, 400, logo).save(ROOT / "assets" / "banner.png")
    banner(440, 280, logo, tagline="Ad & tracker blocker").save(STORE / "promo-small-440x280.png")
    banner(1400, 560, logo).save(STORE / "promo-marquee-1400x560.png")
    print("Generated icons, logo, banner and store promo images.")


if __name__ == "__main__":
    main()
