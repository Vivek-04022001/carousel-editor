"""Post-render extras: starter IG caption (+ pillar hashtags) and a contact sheet."""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image

from .constants import H, W

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
