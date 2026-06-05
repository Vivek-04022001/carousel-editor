"""
The Grey Mind — carousel generator (CLI entrypoint).

Renders 1080×1350 PNG slides from the SAME JSON the browser editor
(`carousel_editor.html`) exports — i.e. a full editor `state` object. This keeps
one source of truth: write/lay-out in the editor, batch-render with this script.

The rendering engine lives in the `greymind/` package (split by concern):
    greymind/constants.py  canvas size + slide-type sets
    greymind/fonts.py      Space Grotesk loading + weight resolution
    greymind/colors.py     hex parsing + export-safe blend maths
    greymind/markup.py     **bold**/[w]/[c]/[sz] runs, drawing, word-wrap
    greymind/doc.py        the editor `state` accessor (Doc)
    greymind/blocks.py     measurable/drawable block model per slide type
    greymind/render.py     chrome + per-slide layout + generate()
    greymind/caption.py    starter caption (+ hashtags) + contact sheet

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
import sys
from pathlib import Path

from greymind import build_caption, contact_sheet, generate


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
