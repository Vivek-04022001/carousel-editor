"""
Lucid script -> editor JSON.

Bridges the writing step (Lucid, per `The Grey Mind.skill`) and the render step
(`carousel_editor.html` / `carousel.py`). Lucid writes a carousel in a small, readable
plain-text format; this turns it into a full editor `state` JSON you can either open in the
editor or batch-render:

    python lucid_to_editor.py script.txt --out content_data/my_carousel.json
    python carousel.py content_data/my_carousel.json --out output/my_carousel --sheet --caption

----------------------------------------------------------------------------------------
SCRIPT FORMAT  (mirrors the skill's carousel order: eyebrow -> title -> body -> CTA)
----------------------------------------------------------------------------------------
A header block (key: value lines) builds the COVER, then `== type ==` markers add slides.

    PILLAR: people                 # people | self | power   (optional, default people)
    EYEBROW: SOCIAL DYNAMICS       # the one all-caps category label (cover)
    TITLE: The Psychology Behind Why You're Liked More When You Care Less.
    SUBTITLE: (but most people get this backwards)   # optional; rendered light under the title
    WORDMARK: THE GREY MIND        # optional override
    HANDLE: @_thegreymind_         # optional override

    == body ==
    let's be clear about what "caring less" actually means.   # first paragraph = heading

    It is not coldness. It is not pretending people don't matter.   # rest = body

    == quote ==
    Detachment isn't the absence of care.
    It's the **presence of self.**
    ATTRIBUTION: — Lucid          # optional

    == compare ==
    HEADING: Caring less, in one contrast:
    A: The trap | You explain yourself until they finally approve.
    B: The move | You say it once and let the silence hold.

    == term ==
    TERM: Outcome dependence
    EXAMPLE: e.g. re-reading a text to check if they "still" like you.
    Needing a specific reaction before you feel okay. It hands them the controls.

    == interrupt ==
    KICKER: Read this twice
    You don't need them to **agree.** You need you to **decide.**

    == recap ==
    KICKER: Save this
    TITLE: The whole thing, in four lines:
    - Caring less = self, not coldness.
    - Neediness leaks — people feel it.

    == cta ==
    Save this. You'll need it the next time you catch yourself trying too hard.

Inline markup (**bold**, [w=300]…[/w], [c=#hex]…[/c], [sz=80]…[/sz]) passes straight through.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
BASE_JSON = ROOT / "content_data" / "the_grey_mind_sample.json"  # canonical config (type/layout/colours)
HEADER_KEYS = {"PILLAR", "EYEBROW", "TITLE", "SUBTITLE", "WORDMARK", "HANDLE"}
MARKER = re.compile(r"^==\s*([A-Za-z]+)\s*==\s*$")
KEYLINE = re.compile(r"^([A-Za-z]+):\s?(.*)$")


def _split_known(lines, keys):
    """Pull `KEY: value` lines whose KEY is in `keys`; return (fields, remaining_lines)."""
    fields, rest = {}, []
    for ln in lines:
        m = KEYLINE.match(ln)
        if m and m.group(1).upper() in keys:
            fields[m.group(1).upper()] = m.group(2).strip()
        else:
            rest.append(ln)
    return fields, rest


def _body(lines) -> str:
    return "\n".join(lines).strip("\n")


def _paragraphs(lines):
    text = _body(lines)
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()] if text else []


def parse_script(text: str):
    raw = text.replace("\r\n", "\n").split("\n")
    header, blocks, cur_type, cur_lines = [], [], None, []

    def flush():
        if cur_type is not None:
            blocks.append((cur_type.lower(), cur_lines))

    in_body = False
    for ln in raw:
        m = MARKER.match(ln.strip())
        if m:
            in_body = True
            flush()
            cur_type = m.group(1)
            cur_lines = []
            continue
        (cur_lines if in_body else header).append(ln)
    flush()

    hdr, _ = _split_known(header, HEADER_KEYS)
    return hdr, blocks


def build_slide(kind: str, lines):
    if kind == "body":
        paras = _paragraphs(lines)
        heading = paras[0] if paras else ""
        body = "\n\n".join(paras[1:])
        return {"type": "body", "heading": heading, "body": body}
    if kind == "quote":
        f, rest = _split_known(lines, {"EYEBROW", "ATTRIBUTION"})
        s = {"type": "quote", "quote": _body(rest)}
        if f.get("EYEBROW"): s["eyebrow"] = f["EYEBROW"]
        if f.get("ATTRIBUTION"): s["attribution"] = f["ATTRIBUTION"]
        return s
    if kind == "compare":
        f, rest = _split_known(lines, {"HEADING", "A", "B", "COLORA", "COLORB"})
        s = {"type": "compare", "heading": f.get("HEADING", "")}
        for side, key in (("A", "colorA"), ("B", "colorB")):
            val = f.get(side, "")
            label, _, txt = val.partition("|")
            s[f"label{side}"] = label.strip()
            s[f"text{side}"] = txt.strip()
        if f.get("COLORA"): s["colorA"] = f["COLORA"]
        if f.get("COLORB"): s["colorB"] = f["COLORB"]
        return s
    if kind == "term":
        f, rest = _split_known(lines, {"EYEBROW", "TERM", "EXAMPLE"})
        s = {"type": "term", "term": f.get("TERM", ""), "definition": _body(rest)}
        if f.get("EYEBROW"): s["eyebrow"] = f["EYEBROW"]
        if f.get("EXAMPLE"): s["example"] = f["EXAMPLE"]
        return s
    if kind == "interrupt":
        f, rest = _split_known(lines, {"KICKER"})
        return {"type": "interrupt", "kicker": f.get("KICKER", ""), "line": _body(rest)}
    if kind == "recap":
        f, rest = _split_known(lines, {"KICKER", "TITLE"})
        items = [re.sub(r"^[-•]\s*", "", ln).strip() for ln in rest if ln.strip().startswith(("-", "•"))]
        return {"type": "recap", "kicker": f.get("KICKER", ""), "title": f.get("TITLE", ""), "items": items}
    if kind == "cta":
        f, rest = _split_known(lines, {"EYEBROW", "KICKER"})
        s = {"type": "cta", "text": _body(rest)}
        if f.get("EYEBROW") or f.get("KICKER"): s["eyebrow"] = f.get("EYEBROW") or f.get("KICKER")
        return s
    raise ValueError(f"Unknown slide type: == {kind} ==")


def build_state(hdr, blocks, base: dict):
    state = json.loads(json.dumps(base))  # deep copy of canonical config
    pillar = (hdr.get("PILLAR") or state.get("pillar", "people")).lower()
    if pillar not in state["pillars"]:
        raise ValueError(f"Unknown pillar '{pillar}'. Use one of: {', '.join(state['pillars'])}")
    state["pillar"] = pillar
    if hdr.get("WORDMARK"): state["wordmark"] = hdr["WORDMARK"]
    if hdr.get("HANDLE"): state["handle"] = hdr["HANDLE"]

    title = hdr.get("TITLE", "")
    if hdr.get("SUBTITLE"):
        title = f"{title}\n[w=300]{hdr['SUBTITLE']}[/w]"
    cover = {"type": "cover", "title": title}
    if hdr.get("EYEBROW"): cover["eyebrow"] = hdr["EYEBROW"]

    state["slides"] = [cover] + [build_slide(k, ls) for k, ls in blocks]
    state["current"] = 0
    return state


def convert(text: str, base_path: Path = BASE_JSON):
    base = json.loads(Path(base_path).read_text(encoding="utf-8"))
    hdr, blocks = parse_script(text)
    return build_state(hdr, blocks, base)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Convert a Lucid carousel script to editor JSON.")
    ap.add_argument("script", help="Lucid carousel script (.txt)")
    ap.add_argument("--out", required=True, help="output editor JSON path")
    ap.add_argument("--base", default=str(BASE_JSON), help="base config JSON (default: the_grey_mind_sample.json)")
    args = ap.parse_args(argv)

    text = Path(args.script).read_text(encoding="utf-8")
    try:
        state = convert(text, Path(args.base))
    except ValueError as e:
        sys.exit(f"Error: {e}")
    Path(args.out).write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(state['slides'])} slide(s) -> {args.out}")
    print("  cover + " + ", ".join(s["type"] for s in state["slides"][1:]))


if __name__ == "__main__":
    main()
