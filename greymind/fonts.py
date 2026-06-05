"""Space Grotesk font loading + weight resolution (cached)."""

from __future__ import annotations

from pathlib import Path

from PIL import ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "fonts" / "Space_Grotesk" / "static"

WEIGHTS = [300, 400, 500, 600, 700]
WEIGHT_FILE = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold"}

_font_cache: dict = {}


def nearest_weight(w: int) -> int:
    return min(WEIGHTS, key=lambda o: abs(o - int(w)))


def font(weight: int, size: int) -> ImageFont.FreeTypeFont:
    key = (nearest_weight(weight), int(size))
    f = _font_cache.get(key)
    if f is None:
        f = ImageFont.truetype(str(FONT_DIR / f"SpaceGrotesk-{WEIGHT_FILE[key[0]]}.ttf"), key[1])
        _font_cache[key] = f
    return f
