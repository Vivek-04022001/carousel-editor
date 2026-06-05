"""Chrome (wordmark / counter / left bar), per-slide layout, and batch generate()."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

from .blocks import block_height, build_blocks, draw_block
from .colors import hex_rgb
from .constants import DARK_TYPES, H, TOP_TYPES, W
from .doc import Doc
from .fonts import font
from .markup import draw_line, runs_width


# ---------- chrome ----------
def draw_chrome(draw, doc: Doc, slide, idx, total):
    m = doc.layout["margin"]
    pos = doc.layout.get("pos", {})
    # left bar (dark slides)
    if slide["type"] in DARK_TYPES and doc.colors.get("barShow", True):
        bw = doc.colors.get("barWidth", 8)
        if bw > 0:
            draw.rectangle([0, 0, bw, H], fill=doc.accent())
    # wordmark (top-left)
    wm = doc.type["wordmark"]
    o = pos.get("wordmark", {})
    draw_line(draw, m + o.get("x", 0), m + o.get("y", 0),
              [(doc.s["wordmark"].upper(), wm["size"], wm["weight"], doc.el_rgb("wordmark", slide))],
              doc.track_px(wm))
    # counter (bottom-right)
    ct = doc.type["counter"]
    label = f"{idx + 1:02d}/{total:02d}"
    cw = runs_width([(label, ct["size"], ct["weight"], (0, 0, 0))], doc.track_px(ct))
    cf = font(ct["weight"], ct["size"])
    oc = pos.get("counter", {})
    cx = W - m - cw + oc.get("x", 0)
    cy = H - m - cf.getmetrics()[0] + oc.get("y", 0)
    draw_line(draw, cx, cy, [(label, ct["size"], ct["weight"], doc.el_rgb("counter", slide))], doc.track_px(ct))


# ---------- slide render ----------
def render_slide(doc: Doc, slide, idx, total) -> Image.Image:
    img = Image.new("RGB", (W, H), hex_rgb(doc.bg_hex(slide)))
    draw = ImageDraw.Draw(img)
    draw_chrome(draw, doc, slide, idx, total)

    m = doc.layout["margin"]
    maxw = W - 2 * m
    blocks = build_blocks(doc, slide)
    total_h = sum(block_height(b, maxw) + b.get("gap", 0) for b in blocks)

    if slide["type"] in TOP_TYPES:
        tops = {"compare": doc.layout.get("compareTop"), "term": doc.layout.get("termTop"),
                "recap": doc.layout.get("recapTop")}
        y = tops.get(slide["type"]) or doc.layout["bodyTop"]
    else:
        shift = {"cover": doc.layout.get("coverShift", 0), "cta": doc.layout.get("ctaShift", 0),
                 "quote": doc.layout.get("quoteShift", 0), "interrupt": doc.layout.get("interruptShift", 0)}.get(slide["type"], 0)
        y = (H - total_h) / 2 + shift

    for b in blocks:
        draw_block(draw, doc, slide, b, m, y, maxw)
        y += block_height(b, maxw) + b.get("gap", 0)
    return img


def generate(state: dict, out_dir: Path, fmt: str = "png"):
    doc = Doc(state)
    slides = state["slides"]
    total = len(slides)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths, imgs = [], []
    for i, slide in enumerate(slides):
        img = render_slide(doc, slide, i, total)
        p = out_dir / f"slide_{i + 1:02d}.{fmt}"
        img.save(p, quality=95) if fmt in ("jpg", "jpeg") else img.save(p)
        paths.append(p)
        imgs.append(img)
    return paths, imgs
