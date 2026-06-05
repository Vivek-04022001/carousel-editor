"""The block model: measurable + drawable units the layout engine arranges.

Each content block is a dict the layout engine can measure + draw:
  {"kind":"text", field, raw, size, weight, rgb, track, lh, upper, gap}
  {"kind":"rule", field, w, h, rgb, mt, mb}            (term accent rule / compare divider)
  {"kind":"list", field, items, size, weight, rgb, track, lh, mark_rgb, gap}
"""

from __future__ import annotations

from .colors import hex_rgb
from .constants import W
from .doc import Doc
from .fonts import font
from .markup import draw_line, parse_runs, text_lines, wrap_runs


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
