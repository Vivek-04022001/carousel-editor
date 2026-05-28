"""
Instagram carousel generator — 1080x1350 PNG slides.

Usage:
    python carousel.py content_data/example.json --out output/

Content JSON schema:
{
  "brand": "MillionaireMoveX",
  "handle": "@millionairemovex",
  "cover": {
    "title": "10 things people notice about you:",
    "subtitle": "(but will never tell you)"
  },
  "slides": [
    {"heading": "1.The state of your hands.", "body": "Not manicure, but **skin**..."},
    ...
  ]
}

Inline emphasis: wrap any span with **double asterisks** in body/heading text to render
it in bold + accent color.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
FONTS_DIR = ROOT / "fonts"
WIN_FONTS = Path(r"C:\Windows\Fonts")

W, H = 1080, 1350
MARGIN_X = 90

COVER_BG = (58, 58, 58)
COVER_FG = (190, 190, 190)
COVER_ACCENT = (240, 240, 240)
COVER_TRACK = (100, 100, 100)

BODY_BG = (188, 188, 188)
BODY_FG = (40, 40, 40)
BODY_ACCENT = (10, 10, 10)
BODY_TRACK = (145, 145, 145)

HEADER_FG_COVER = (190, 190, 190)
HEADER_FG_BODY = (40, 40, 40)


def find_font(candidates: list[str]) -> Path:
    """Return first existing font file. Searches fonts/ recursively, then Windows fonts."""
    project_fonts = {p.name.lower(): p for p in FONTS_DIR.rglob("*.ttf")} if FONTS_DIR.exists() else {}
    for name in candidates:
        if name.lower() in project_fonts:
            return project_fonts[name.lower()]
        p = WIN_FONTS / name
        if p.exists():
            return p
    raise FileNotFoundError(f"None of these fonts found: {candidates}")


@dataclass
class Fonts:
    regular: Path
    bold: Path
    italic: Path
    bold_italic: Path

    @classmethod
    def load(cls) -> "Fonts":
        return cls(
            regular=find_font([
                "Montserrat-Medium.ttf", "Montserrat-Regular.ttf",
                "Mulish-Regular.ttf", "Nunito-Regular.ttf", "segoeui.ttf",
            ]),
            bold=find_font([
                "Montserrat-ExtraBold.ttf", "Montserrat-Bold.ttf",
                "Mulish-ExtraBold.ttf", "Mulish-Bold.ttf", "Nunito-Bold.ttf", "segoeuib.ttf",
            ]),
            italic=find_font([
                "Montserrat-Italic.ttf", "Montserrat-MediumItalic.ttf",
                "Mulish-Italic.ttf", "Nunito-Italic.ttf", "segoeuii.ttf",
            ]),
            bold_italic=find_font([
                "Montserrat-BoldItalic.ttf", "Montserrat-ExtraBoldItalic.ttf",
                "Mulish-BoldItalic.ttf", "Nunito-BoldItalic.ttf", "segoeuiz.ttf",
            ]),
        )

    def at(self, path: Path, size: int) -> ImageFont.FreeTypeFont:
        return ImageFont.truetype(str(path), size=size)


# ---------- inline-bold parsing & wrapping ----------

def parse_runs(text: str) -> list[tuple[str, bool]]:
    """Split text by **bold** markers into (text, is_bold) runs. Preserves '\\n'."""
    runs: list[tuple[str, bool]] = []
    bold = False
    buf = ""
    i = 0
    while i < len(text):
        if text[i:i + 2] == "**":
            if buf:
                runs.append((buf, bold))
                buf = ""
            bold = not bold
            i += 2
        else:
            buf += text[i]
            i += 1
    if buf:
        runs.append((buf, bold))
    return runs


def _to_words(runs: list[tuple[str, bool]]) -> list[tuple[str, bool, bool]]:
    """Flatten runs to (word, is_bold, hard_break_after). hard_break marks an explicit '\\n'."""
    out: list[tuple[str, bool, bool]] = []
    for text, bold in runs:
        parts = text.split("\n")
        for pi, para in enumerate(parts):
            for w in para.split(" "):
                if w:
                    out.append((w, bold, False))
            if pi < len(parts) - 1:
                if out and not out[-1][2]:
                    word, b, _ = out[-1]
                    out[-1] = (word, b, True)
                else:
                    out.append(("", False, True))
    return out


def wrap_styled(
    text: str,
    regular_font: ImageFont.FreeTypeFont,
    bold_font: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[list[tuple[str, bool]]]:
    """Greedy word-wrap honoring **bold** spans. Returns lines; each line is [(word, bold), ...]."""
    runs = parse_runs(text)
    words = _to_words(runs)
    lines: list[list[tuple[str, bool]]] = []
    line: list[tuple[str, bool]] = []
    line_w = 0.0
    space_w = regular_font.getlength(" ")

    for word, bold, hard in words:
        if word:
            font = bold_font if bold else regular_font
            ww = font.getlength(word)
            prefix = space_w if line else 0
            if line and line_w + prefix + ww > max_width:
                lines.append(line)
                line = [(word, bold)]
                line_w = ww
            else:
                line.append((word, bold))
                line_w += prefix + ww
        if hard:
            lines.append(line)
            line = []
            line_w = 0.0
    if line:
        lines.append(line)
    return lines


def draw_styled_block(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    lines: list[list[tuple[str, bool]]],
    regular_font: ImageFont.FreeTypeFont,
    bold_font: ImageFont.FreeTypeFont,
    fg,
    accent,
    line_height: int,
) -> int:
    space_w = regular_font.getlength(" ")
    for line in lines:
        cur_x = x
        for i, (word, bold) in enumerate(line):
            font = bold_font if bold else regular_font
            fill = accent if bold else fg
            if i > 0:
                cur_x += space_w
            draw.text((cur_x, y), word, font=font, fill=fill)
            cur_x += font.getlength(word)
        y += line_height
    return y


# ---------- chrome: header + footer (counter + progress bar) ----------

def draw_header(
    img: Image.Image,
    draw: ImageDraw.ImageDraw,
    fonts: Fonts,
    brand: str,
    handle: str,
    fg,
) -> None:
    """Draw 'Brand ——— @handle' header row at top of slide."""
    font = fonts.at(fonts.regular, 28)
    y = 70
    pad = 18

    brand_w = font.getlength(brand)
    handle_w = font.getlength(handle)

    left_x = MARGIN_X
    right_x_end = W - MARGIN_X
    right_x_start = right_x_end - handle_w

    draw.text((left_x, y), brand, font=font, fill=fg)
    draw.text((right_x_start, y), handle, font=font, fill=fg)

    line_y = y + font.getmetrics()[0] // 2 + 4
    line_start = left_x + brand_w + pad
    line_end = right_x_start - pad
    if line_end > line_start:
        draw.line([(line_start, line_y), (line_end, line_y)], fill=fg, width=2)


def draw_footer(
    draw: ImageDraw.ImageDraw,
    fonts: Fonts,
    index: int,
    total: int,
    fg,
    track_color,
) -> None:
    """Draw '01 / 08' counter + bottom progress bar."""
    counter_font = fonts.at(fonts.italic, 24)
    label = f"{index:02d} / {total:02d}"

    label_y = H - 78
    draw.text((MARGIN_X, label_y), label, font=counter_font, fill=fg)

    bar_left = MARGIN_X
    bar_right = W - MARGIN_X
    bar_y = H - 40
    bar_h = 4
    draw.rectangle([bar_left, bar_y, bar_right, bar_y + bar_h], fill=track_color)

    if total > 0:
        fill_w = int((bar_right - bar_left) * (index / total))
        if fill_w > 0:
            draw.rectangle([bar_left, bar_y, bar_left + fill_w, bar_y + bar_h], fill=fg)


# ---------- slide renderers ----------

def render_cover(
    out_path: Path,
    fonts: Fonts,
    brand: str,
    handle: str,
    title: str,
    subtitle: str,
    index: int,
    total: int,
) -> None:
    img = Image.new("RGB", (W, H), COVER_BG)
    draw = ImageDraw.Draw(img)

    draw_header(img, draw, fonts, brand, handle, HEADER_FG_COVER)

    title_font = fonts.at(fonts.bold, 86)
    sub_font = fonts.at(fonts.bold_italic, 54)

    max_w = W - 2 * MARGIN_X
    title_lines = wrap_styled(title, title_font, title_font, max_w)
    sub_lines = wrap_styled(subtitle, sub_font, sub_font, max_w) if subtitle else []

    t_ascent, t_descent = title_font.getmetrics()
    t_lh = int((t_ascent + t_descent) * 1.02)
    s_ascent, s_descent = sub_font.getmetrics()
    s_lh = int((s_ascent + s_descent) * 1.10)

    y = int(H * 0.36)
    y = draw_styled_block(draw, MARGIN_X, y, title_lines, title_font, title_font, COVER_FG, COVER_ACCENT, t_lh)

    if sub_lines:
        # Accent divider between title and subtitle
        y += 24
        draw.line([(MARGIN_X, y), (MARGIN_X + 110, y)], fill=COVER_ACCENT, width=3)
        y += 26
        draw_styled_block(draw, MARGIN_X, y, sub_lines, sub_font, sub_font, COVER_FG, COVER_ACCENT, s_lh)

    # "swipe →" cue, bottom-right above footer
    swipe_font = fonts.at(fonts.italic, 30)
    swipe_text = "swipe →"
    sw_w = swipe_font.getlength(swipe_text)
    draw.text((W - MARGIN_X - sw_w, H - 135), swipe_text, font=swipe_font, fill=COVER_ACCENT)

    draw_footer(draw, fonts, index, total, COVER_FG, COVER_TRACK)

    img.save(out_path, "PNG", optimize=True)


def render_body(
    out_path: Path,
    fonts: Fonts,
    brand: str,
    handle: str,
    heading: str,
    body: str,
    index: int,
    total: int,
) -> None:
    img = Image.new("RGB", (W, H), BODY_BG)
    draw = ImageDraw.Draw(img)

    draw_header(img, draw, fonts, brand, handle, HEADER_FG_BODY)

    heading_font = fonts.at(fonts.bold, 50)
    body_reg = fonts.at(fonts.regular, 46)
    body_bold = fonts.at(fonts.bold, 46)

    max_w = W - 2 * MARGIN_X
    h_lines = wrap_styled(heading, heading_font, heading_font, max_w)
    b_lines = wrap_styled(body, body_reg, body_bold, max_w)

    h_ascent, h_descent = heading_font.getmetrics()
    h_lh = int((h_ascent + h_descent) * 1.15)
    b_ascent, b_descent = body_reg.getmetrics()
    b_lh = int((b_ascent + b_descent) * 1.15)

    y = int(H * 0.36)
    y = draw_styled_block(draw, MARGIN_X, y, h_lines, heading_font, heading_font, BODY_FG, BODY_ACCENT, h_lh)
    y += 6
    draw_styled_block(draw, MARGIN_X, y, b_lines, body_reg, body_bold, BODY_FG, BODY_ACCENT, b_lh)

    draw_footer(draw, fonts, index, total, BODY_FG, BODY_TRACK)

    img.save(out_path, "PNG", optimize=True)


def generate(content_path: Path, out_dir: Path) -> list[Path]:
    data = json.loads(content_path.read_text(encoding="utf-8"))
    fonts = Fonts.load()
    out_dir.mkdir(parents=True, exist_ok=True)

    brand = data.get("brand", "MillionaireMoveX")
    handle = data.get("handle", "@millionairemovex")

    cover = data.get("cover")
    slides = data.get("slides", [])
    total = (1 if cover else 0) + len(slides)

    written: list[Path] = []
    idx = 1

    if cover:
        p = out_dir / f"slide_{idx:02d}.png"
        render_cover(p, fonts, brand, handle, cover["title"], cover.get("subtitle", ""), idx, total)
        written.append(p)
        idx += 1

    for s in slides:
        p = out_dir / f"slide_{idx:02d}.png"
        render_body(p, fonts, brand, handle, s["heading"], s["body"], idx, total)
        written.append(p)
        idx += 1

    return written


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Instagram carousel generator")
    ap.add_argument("content", type=Path, help="Path to content JSON")
    ap.add_argument("--out", type=Path, default=Path("output"), help="Output directory")
    args = ap.parse_args(argv)

    paths = generate(args.content, args.out)
    print(f"Generated {len(paths)} slides:")
    for p in paths:
        print(f"  {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
