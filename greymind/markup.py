"""Inline markup -> styled runs, line drawing, and markup-aware word-wrapping.

Inline markup (per text field): **bold** · [w=300]…[/w] · [c=#6B1A1A]…[/c] · [sz=80]…[/sz].
Manual line breaks: a literal "\n" in the text starts a new line (no auto-wrap).
"""

from __future__ import annotations

import re

from PIL import ImageDraw

from .colors import hex_rgb
from .fonts import font

# ---------- markup -> styled runs ----------
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
