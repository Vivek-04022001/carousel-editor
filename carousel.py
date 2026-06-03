"""
The Grey Mind — carousel generator (Pillow).

Renders 1080×1350 PNG slides from the SAME JSON the browser editor
(`carousel_editor.html`) exports — i.e. a full editor `state` object. This keeps
one source of truth: write/lay-out in the editor, batch-render with this script.

Usage:
    python carousel.py thegreymind_people.json --out output/people
    python carousel.py thegreymind_people.json --out output/people --format jpg

JSON schema (abridged — see the editor's defaultState):
{
  "wordmark": "THE GREY MIND", "handle": "@_thegreymind_",
  "pillar": "people",
  "pillars": { "people": {"label":"PEOPLE","accent":"#6B1A1A"}, ... },
  "colors":  { "bodyBg":"#0a0a0a", "text":"#F5F5F5", "barShow":true, "barWidth":8 },
  "elements":{ "eyebrow":{"color":"#F5F5F5","opacity":0.55,"blend":"overlay"}, ... },
  "type":    { "title":{"size":95,"weight":500,"lh":105,"track":0}, ... },
  "layout":  { "margin":80, "bodyTop":360, "compareTop":300, ... },
  "slides":  [ {"type":"cover","eyebrow":"...","title":"..."}, ... ]
}

Slide types: cover · body · cta · quote · compare · term · interrupt · recap.
Inline markup (per text field): **bold** · [w=300]…[/w] · [c=#6B1A1A]…[/c] · [sz=80]…[/sz].
Manual line breaks: a literal "\n" in the text starts a new line (no auto-wrap).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
FONT_DIR = ROOT / "fonts" / "Space_Grotesk" / "static"
W, H = 1080, 1350

WEIGHTS = [300, 400, 500, 600, 700]
WEIGHT_FILE = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold"}
DARK_TYPES = {"body", "compare", "term"}          # charcoal bg + left accent bar
TOP_TYPES = {"body", "compare", "term", "recap"}  # top-aligned (vs vertically centred)

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


# ---------- colour + blend (ported from the editor, export-safe flat colour) ----------
def _clamp8(x: float) -> int:
    return max(0, min(255, int(round(x))))


def hex_rgb(h: str):
    h = (h or "").lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return (245, 245, 245)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _blend_ch(b: float, s: float, mode: str) -> float:
    if mode == "multiply":    return b * s
    if mode == "screen":      return 1 - (1 - b) * (1 - s)
    if mode == "overlay":     return 2 * b * s if b < 0.5 else 1 - 2 * (1 - b) * (1 - s)
    if mode == "hard-light":  return 2 * b * s if s < 0.5 else 1 - 2 * (1 - b) * (1 - s)
    if mode == "soft-light":
        if s < 0.5:
            return b - (1 - 2 * s) * b * (1 - b)
        d = ((16 * b - 12) * b + 4) * b if b < 0.25 else b ** 0.5
        return b + (2 * s - 1) * (d - b)
    if mode == "color-dodge": return 1.0 if s >= 1 else min(b / (1 - s), 1.0)
    if mode == "lighten":     return max(b, s)
    if mode == "darken":      return min(b, s)
    return s  # normal


def blend_over(bg_hex: str, top_hex: str, mode: str, opacity: float):
    B = [c / 255 for c in hex_rgb(bg_hex)]
    S = [c / 255 for c in hex_rgb(top_hex)]
    out = []
    for i in range(3):
        blended = _blend_ch(B[i], S[i], mode)
        out.append((B[i] + (blended - B[i]) * opacity) * 255)
    return tuple(_clamp8(v) for v in out)


# ---------- markup → styled runs ----------
_TOKEN = re.compile(r"(\*\*|\[w=\d{3}\]|\[c=#?[0-9a-fA-F]{3,8}\]|\[sz=\d{1,3}\]|\[/(?:w|c|sz)?\])")


def parse_runs(raw: str, base_size: int, base_weight: int, base_rgb):
    """Return [(text, size, weight, rgb), ...] for one line of markup."""
    runs = []
    stack = []          # opened [..] spans, each a dict of overrides
    bold = False
    buf = ""

    def cur():
        size, weight, rgb = base_size, base_weight, base_rgb
        for sp in stack:
            if "weight" in sp: weight = sp["weight"]
            if "size" in sp:   size = sp["size"]
            if "rgb" in sp:    rgb = sp["rgb"]
        if bold:
            weight = 700
        return size, weight, rgb

    def flush():
        nonlocal buf
        if buf:
            s, w, c = cur()
            runs.append((buf, s, w, c))
            buf = ""

    for tok in _TOKEN.split(raw or ""):
        if tok == "":
            continue
        if tok == "**":
            flush(); bold = not bold
        elif tok.startswith("[w="):
            flush(); stack.append({"weight": int(tok[3:6])})
        elif tok.startswith("[sz="):
            flush(); stack.append({"size": int(tok[4:-1])})
        elif tok.startswith("[c="):
            flush(); stack.append({"rgb": hex_rgb(tok[3:-1])})
        elif tok.startswith("[/"):
            flush()
            if stack:
                stack.pop()
        else:
            buf += tok
    flush()
    return runs


def runs_width(runs, track_px: float) -> float:
    total = 0.0
    n = 0
    for text, size, weight, _ in runs:
        f = font(weight, size)
        for ch in text:
            total += f.getlength(ch) + track_px
            n += 1
    return total - track_px if n else 0.0


def draw_line(draw: ImageDraw.ImageDraw, x: float, y: float, runs, track_px: float):
    cx = float(x)
    for text, size, weight, rgb in runs:
        f = font(weight, size)
        for ch in text:
            draw.text((cx, y), ch, font=f, fill=rgb, anchor="la")
            cx += f.getlength(ch) + track_px


# ---------- word-wrapping (markup-aware; mirrors the browser's auto-wrap within margins) ----------
def _atoms(runs):
    return [(ch, size, weight, rgb) for text, size, weight, rgb in runs for ch in text]


def _seg_width(atoms, track):
    w = sum(font(weight, size).getlength(ch) + track for ch, size, weight, rgb in atoms)
    return w - track if atoms else 0.0


def _merge(atoms):
    runs = []
    for ch, size, weight, rgb in atoms:
        if runs and runs[-1][1:] == (size, weight, rgb):
            runs[-1] = (runs[-1][0] + ch, size, weight, rgb)
        else:
            runs.append((ch, size, weight, rgb))
    return runs


def wrap_runs(runs, maxw: float, track: float):
    """Greedily wrap one logical line of styled runs to maxw. Returns list of lines (each a run list)."""
    atoms = _atoms(runs)
    if not atoms:
        return [[]]
    space = (" ",) + atoms[0][1:]
    words, cur = [], []
    for a in atoms:
        if a[0] == " ":
            words.append(cur); cur = []
        else:
            cur.append(a)
    words.append(cur)
    lines, line = [], []
    for word in words:
        if not word:
            continue
        trial = line + ([space] if line else []) + word
        if line and _seg_width(trial, track) > maxw:
            lines.append(line); line = word
        else:
            line = trial
    lines.append(line)
    return [_merge(l) for l in lines]


def text_lines(b, maxw: float):
    """Wrapped lines for a text block (cached on the block)."""
    if "_lines" in b:
        return b["_lines"]
    raw = b["raw"].upper() if b["upper"] else b["raw"]
    out = []
    for para in (raw.split("\n") if raw != "" else [""]):
        out.extend(wrap_runs(parse_runs(para, b["size"], b["weight"], b["rgb"]), maxw, b["track"]))
    b["_lines"] = out
    return out


# ---------- state helpers ----------
class Doc:
    def __init__(self, state: dict):
        self.s = state
        self.type = state["type"]
        self.layout = state["layout"]
        self.colors = state["colors"]
        self.elements = state["elements"]
        self.pillar = state.get("pillar", "people")
        self.pillars = state["pillars"]
        self.text_rgb = hex_rgb(self.colors["text"])

    def accent(self):
        return hex_rgb(self.pillars[self.pillar]["accent"])

    def accent_hex(self):
        return self.pillars[self.pillar]["accent"]

    def bg_hex(self, slide):
        return self.colors["bodyBg"] if slide["type"] in DARK_TYPES else self.accent_hex()

    def el_rgb(self, role, slide):
        e = self.elements[role]
        return blend_over(self.bg_hex(slide), e["color"], e["blend"], e["opacity"])

    def track_px(self, cfg):
        return cfg.get("track", 0) / 1000 * cfg["size"]


# ---------- block model ----------
# Each content block is a dict the layout engine can measure + draw:
#   {"kind":"text", field, raw, size, weight, rgb, track, lh, upper, gap}
#   {"kind":"rule", field, w, h, rgb, mt, mb}            (term accent rule / compare divider)
#   {"kind":"list", field, items, size, weight, rgb, track, lh, mark_rgb, gap}
def _text(field, raw, cfg, rgb, *, upper=False, gap=0, lh=None, track=None):
    return {"kind": "text", "field": field, "raw": raw or "",
            "size": cfg["size"], "weight": cfg["weight"], "rgb": rgb,
            "track": cfg["size"] * (track if track is not None else cfg.get("track", 0)) / 1000,
            "lh": lh if lh is not None else cfg.get("lh", cfg["size"]),
            "upper": upper, "gap": gap}


def build_blocks(doc: Doc, slide: dict):
    t, ty = slide["type"], doc.type
    eb = lambda: _text("eyebrow", slide.get("eyebrow", ""), ty["eyebrow"], doc.el_rgb("eyebrow", slide),
                       upper=True, gap=ty["eyebrow"]["gap"])
    blocks = []

    if t == "cover":
        if slide.get("eyebrow", "").strip(): blocks.append(eb())
        blocks.append(_text("title", slide.get("title", ""), ty["title"], doc.text_rgb))
    elif t == "body":
        blocks.append(_text("heading", slide.get("heading", ""), ty["heading"], doc.text_rgb, gap=ty["heading"]["gap"]))
        blocks.append(_text("body", slide.get("body", ""), ty["body"], doc.text_rgb))
    elif t == "cta":
        if slide.get("eyebrow", "").strip(): blocks.append(eb())
        blocks.append(_text("text", slide.get("text", ""), ty["cta"], doc.text_rgb))
    elif t == "quote":
        if slide.get("eyebrow", "").strip(): blocks.append(eb())
        qm = ty["quotemark"]
        if qm["size"] > 0:
            blocks.append(_text("quotemark", "“", {"size": qm["size"], "weight": qm["weight"], "track": 0},
                                doc.el_rgb("eyebrow", slide), lh=int(qm["size"] * 0.7), gap=qm["gap"]))
        blocks.append(_text("quote", slide.get("quote", ""), ty["quote"], doc.text_rgb))
        if slide.get("attribution", "").strip():
            a = ty["attribution"]
            blk = _text("attribution", slide["attribution"], a, doc.el_rgb("eyebrow", slide), lh=int(a["size"] * 1.2))
            blocks[-1]["gap"] = a["gap"]
            blocks.append(blk)
    elif t == "compare":
        cA = hex_rgb(slide.get("colorA", "#C8553D")); cB = hex_rgb(slide.get("colorB", "#3E9E6E"))
        if slide.get("heading", "").strip():
            blocks.append(_text("heading", slide["heading"], ty["heading"], doc.text_rgb, gap=30))
        lbl, txt = ty["compareLabel"], ty["compareText"]
        if slide.get("labelA", "").strip():
            blocks.append(_text("labelA", slide["labelA"], lbl, cA, upper=True, gap=lbl["gap"]))
        blocks.append(_text("textA", slide.get("textA", ""), txt, doc.text_rgb, gap=26))
        blocks.append({"kind": "rule", "field": "divA", "w": W - 2 * doc.layout["margin"], "h": 2,
                       "rgb": doc.el_rgb("eyebrow", slide), "mt": 0, "mb": 26})
        if slide.get("labelB", "").strip():
            blocks.append(_text("labelB", slide["labelB"], lbl, cB, upper=True, gap=lbl["gap"]))
        blocks.append(_text("textB", slide.get("textB", ""), txt, doc.text_rgb))
    elif t == "term":
        if slide.get("eyebrow", "").strip(): blocks.append(eb())
        tm = ty["term"]
        blocks.append(_text("term", slide.get("term", ""), tm, doc.text_rgb, gap=0))
        if tm.get("ruleW", 0) > 0:
            blocks.append({"kind": "rule", "field": "termrule", "w": tm["ruleW"], "h": 6,
                           "rgb": doc.accent(), "mt": 26, "mb": tm["gap"]})
        blocks.append(_text("definition", slide.get("definition", ""), ty["definition"], doc.text_rgb))
        if slide.get("example", "").strip():
            ex = ty["example"]
            blocks[-1]["gap"] = ex["gap"]
            blocks.append(_text("example", slide["example"], ex, doc.el_rgb("eyebrow", slide), lh=int(ex["size"] * 1.3)))
    elif t == "interrupt":
        if slide.get("kicker", "").strip():
            ik = ty["interruptKicker"]
            blocks.append(_text("kicker", slide["kicker"], ik, doc.el_rgb("eyebrow", slide), upper=True, gap=ik["gap"]))
        blocks.append(_text("line", slide.get("line", ""), ty["interrupt"], doc.text_rgb))
    elif t == "recap":
        if slide.get("kicker", "").strip():
            rk = ty["recapKicker"]
            blocks.append(_text("kicker", slide["kicker"], rk, doc.el_rgb("eyebrow", slide), upper=True, gap=rk["gap"]))
        if slide.get("title", "").strip():
            blocks.append(_text("title", slide["title"], ty["recapTitle"], doc.text_rgb, gap=ty["recapTitle"]["gap"]))
        ri = ty["recapItem"]
        blocks.append({"kind": "list", "field": "items", "items": [i for i in slide.get("items", []) if str(i).strip()],
                       "size": ri["size"], "weight": ri["weight"], "rgb": doc.text_rgb,
                       "track": ri["size"] * ri.get("track", 0) / 1000, "lh": ri["lh"],
                       "mark_rgb": doc.el_rgb("eyebrow", slide), "gap": ri["gap"]})
    return blocks


def _list_item_lines(b, maxw):
    if "_ilines" in b:
        return b["_ilines"]
    mark_f = font(b["weight"], b["size"])
    dash_w = mark_f.getlength("—") + b["size"] * 0.5
    b["_dash_w"] = dash_w
    b["_ilines"] = [wrap_runs(parse_runs(str(it), b["size"], b["weight"], b["rgb"]), maxw - dash_w, b["track"])
                    for it in b["items"]]
    return b["_ilines"]


def block_height(b, maxw) -> float:
    if b["kind"] == "text":
        return len(text_lines(b, maxw)) * b["lh"]
    if b["kind"] == "rule":
        return b["mt"] + b["h"] + b["mb"]
    if b["kind"] == "list":
        return sum(len(ls) * b["lh"] + b["gap"] for ls in _list_item_lines(b, maxw))
    return 0.0


def draw_block(draw, doc: Doc, slide, b, x, y, maxw):
    field = b.get("field")
    off = (slide.get("pos") or {}).get(field)
    if off:
        x += off.get("x", 0); y += off.get("y", 0)
    if b["kind"] == "text":
        for i, line in enumerate(text_lines(b, maxw)):
            draw_line(draw, x, y + i * b["lh"], line, b["track"])
    elif b["kind"] == "rule":
        ry = y + b["mt"]
        draw.rectangle([x, ry, x + b["w"], ry + b["h"]], fill=b["rgb"])
    elif b["kind"] == "list":
        cy = y
        mark_f = font(b["weight"], b["size"])
        ilines = _list_item_lines(b, maxw)
        dash_w = b["_dash_w"]
        for lines in ilines:
            draw.text((x, cy), "—", font=mark_f, fill=b["mark_rgb"], anchor="la")
            for j, line in enumerate(lines):
                draw_line(draw, x + dash_w, cy + j * b["lh"], line, b["track"])
            cy += len(lines) * b["lh"] + b["gap"]


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


PILLAR_TAGS = {
    "people": ["#darkpsychology", "#humanbehavior", "#readingpeople", "#manipulation", "#psychology",
               "#socialdynamics", "#emotionalintelligence", "#bodylanguage", "#mindset", "#selfawareness"],
    "self":   ["#selfmastery", "#emotionalcontrol", "#clarity", "#discipline", "#mindset",
               "#mentalclarity", "#selfawareness", "#innerpeace", "#growth", "#stoicism"],
    "power":  ["#moneymindset", "#wealth", "#discipline", "#success", "#influence",
               "#power", "#leverage", "#selfworth", "#mindset", "#ambition"],
}


def strip_markup(s: str) -> str:
    return re.sub(r"\*\*|\[/?[a-z]*=?[^\]]*\]", "", s or "").strip()


def build_caption(state: dict) -> str:
    """A starter IG caption (hook + CTA + pillar hashtags). Meant to be edited, not posted as-is."""
    slides = state["slides"]
    cover = next((s for s in slides if s["type"] == "cover"), None)
    hook = strip_markup(cover["title"]) if cover else strip_markup(state.get("wordmark", ""))
    handle = state.get("handle", "")
    tags = PILLAR_TAGS.get(state.get("pillar", "people"), [])
    body = [
        hook,
        "",
        "Which one hit home? Tell me below.",
        f"Save this — and follow {handle} for more.",
        "",
        " ".join(tags),
    ]
    return "\n".join(body) + "\n"


def contact_sheet(imgs, out_path: Path, cols: int = 3, thumb_w: int = 320, pad: int = 18, bg=(13, 15, 14)):
    """A single montage image of every slide — quick deck preview."""
    if not imgs:
        return None
    thumb_h = round(thumb_w * H / W)
    rows = (len(imgs) + cols - 1) // cols
    sheet_w = cols * thumb_w + (cols + 1) * pad
    sheet_h = rows * thumb_h + (rows + 1) * pad
    sheet = Image.new("RGB", (sheet_w, sheet_h), bg)
    for i, im in enumerate(imgs):
        r, c = divmod(i, cols)
        x = pad + c * (thumb_w + pad)
        y = pad + r * (thumb_h + pad)
        sheet.paste(im.resize((thumb_w, thumb_h), Image.LANCZOS), (x, y))
    sheet.save(out_path)
    return out_path


def main(argv=None):
    ap = argparse.ArgumentParser(description="Render The Grey Mind carousel slides from an editor JSON export.")
    ap.add_argument("json", help="editor JSON export (a full state object)")
    ap.add_argument("--out", default="output", help="output directory")
    ap.add_argument("--format", default="png", choices=["png", "jpg", "jpeg"], help="image format")
    ap.add_argument("--sheet", action="store_true", help="also write contact_sheet.png (deck preview montage)")
    ap.add_argument("--caption", action="store_true", help="also write caption.txt (starter caption + pillar hashtags)")
    args = ap.parse_args(argv)

    state = json.loads(Path(args.json).read_text(encoding="utf-8"))
    if "slides" not in state or "type" not in state:
        sys.exit("Error: this JSON isn't a Grey Mind editor export (missing 'slides'/'type'). "
                 "Export from carousel_editor.html -> Save JSON.")
    out = Path(args.out)
    paths, imgs = generate(state, out, args.format)
    print(f"Rendered {len(paths)} slide(s) -> {args.out}")
    for p in paths:
        print(f"  {p}")
    if args.sheet:
        sp = contact_sheet(imgs, out / "contact_sheet.png")
        print(f"Contact sheet -> {sp}")
    if args.caption:
        cp = out / "caption.txt"
        cp.write_text(build_caption(state), encoding="utf-8")
        print(f"Caption -> {cp}")


if __name__ == "__main__":
    main()
