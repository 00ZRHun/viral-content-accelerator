#!/usr/bin/env python3
"""Rebuild the landing page's photography and brand assets.

Source photography and the One Peak Creative mark are public assets from the
official One Peak Creative site. Review usage rights with the brand before a
public launch. Run from the project root:

    python3 tools/build_assets.py
"""

from __future__ import annotations

import io
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

OFFICIAL = "https://get.onepeakcreative.com"
HERO = (
    "https://onepeakcreative.com/_next/image"
    "?url=%2Felements%2Fmeg-sitting-transparent.png&w=1920&q=75"
)

PORTRAITS = {
    "kathryn": (f"{OFFICIAL}/ttrcc/students/kathryn_emery.jpg", None),
    "jillaine": (f"{OFFICIAL}/ttrcc/students/jillaine.tattoo.jpg", None),
    "mary-beth": (f"{OFFICIAL}/ttrcc/students/foodincouschurb.jpg", (120, 18, 314, 212)),
    "becca": (f"{OFFICIAL}/ttrcc/profile-photos/becca.jpg", (44, 10, 150, 116)),
    "ruby-neil": (f"{OFFICIAL}/ttrcc/profile-photos/Ruby.jpeg", None),
    "chanelle": (f"{OFFICIAL}/ttrcc/profile-photos/Chanelle.jpeg", None),
    "andrew": (f"{OFFICIAL}/ttrcc/students/nostalgic_nooks_bk.jpg", (0, 10, 135, 145)),
}

COACHES = {
    "meg": f"{OFFICIAL}/ttrcc/coaches/meg.jpg",
    "glen": f"{OFFICIAL}/ttrcc/coaches/glen.jpg",
    "conar": f"{OFFICIAL}/ttrcc/coaches/conar.jpg",
}

LOGOS = {
    "amazon": f"{OFFICIAL}/ttrcc/logo-amazon.png",
    "expedia": f"{OFFICIAL}/ttrcc/logo-expedia-white.png",
    "fairmont": f"{OFFICIAL}/ttrcc/logo-fairmont-white.png",
    "marriott": f"{OFFICIAL}/ttrcc/logo-marriott-white.png",
    "downy": f"{OFFICIAL}/ttrcc/logo-downy-white.png",
}

MARK = f"{OFFICIAL}/ttrcc/logo%20icon.png"


def fetch(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(request, timeout=60) as response:
        return Image.open(io.BytesIO(response.read()))


def save_webp(image: Image.Image, path: Path, quality: int = 86) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB")


def square_crop(image: Image.Image, box: tuple[int, int, int, int] | None) -> Image.Image:
    if box is not None:
        image = image.crop(box)
    return ImageOps.fit(image, (320, 320), Image.Resampling.LANCZOS, centering=(0.5, 0.38))


def build_hero() -> None:
    print("Hero")
    hero = fetch(HERO).convert("RGBA")
    # Drop fully transparent margins so the cutout sits tight inside its frame.
    alpha = hero.getchannel("A")
    bounds = alpha.getbbox()
    if bounds:
        hero = hero.crop(bounds)
    for width in (360, 520, 681):
        height = round(hero.height * width / hero.width)
        resized = hero.resize((width, height), Image.Resampling.LANCZOS)
        save_webp(resized, ASSETS / "images" / f"hero-meg-{width}.webp", 88)


def build_people() -> None:
    print("Member portraits")
    for name, (url, box) in PORTRAITS.items():
        image = fetch(url).convert("RGB")
        portrait = square_crop(image, box)
        save_webp(portrait, ASSETS / "images" / "testimonials" / f"{name}.webp", 84)

    print("Coach portraits")
    for name, url in COACHES.items():
        image = fetch(url).convert("RGB")
        portrait = ImageOps.fit(image, (240, 240), Image.Resampling.LANCZOS, centering=(0.5, 0.35))
        save_webp(portrait, ASSETS / "images" / "coaches" / f"{name}.webp", 82)


def build_logos() -> None:
    print("Client logos")
    for name, url in LOGOS.items():
        image = fetch(url).convert("RGBA")
        bounds = image.getchannel("A").getbbox()
        if bounds:
            image = image.crop(bounds)
        image.thumbnail((600, 160), Image.Resampling.LANCZOS)
        save_webp(image, ASSETS / "images" / "logos" / f"{name}.webp", 90)


def build_brand() -> None:
    print("Brand marks")
    mark = fetch(MARK).convert("RGBA")
    bounds = mark.getchannel("A").getbbox()
    if bounds:
        mark = mark.crop(bounds)
    mark.thumbnail((256, 256), Image.Resampling.LANCZOS)
    out = ASSETS / "brand" / "logo-mark.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    mark.save(out)
    print(f"  {out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB")

    def icon(size: int) -> Image.Image:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        background = Image.new("RGBA", (size, size), (8, 6, 15, 255))
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=round(size * 0.22), fill=255)
        canvas.alpha_composite(Image.composite(background, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask))
        inner = mark.copy()
        inner.thumbnail((round(size * 0.68), round(size * 0.68)), Image.Resampling.LANCZOS)
        canvas.alpha_composite(inner, ((size - inner.width) // 2, (size - inner.height) // 2))
        return canvas

    for size, filename in ((32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")):
        path = ASSETS / "brand" / filename
        icon(size).save(path, "PNG", optimize=True)
        print(f"  {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    build_hero()
    build_people()
    build_logos()
    build_brand()
