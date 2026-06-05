"""The Grey Mind — carousel renderer package.

Renders 1080×1350 slides from the SAME JSON the browser editor
(`carousel_editor.html`) exports — i.e. a full editor `state` object. This keeps
one source of truth: write/lay-out in the editor, batch-render with `carousel.py`.

Public API:
    from greymind import generate, build_caption, contact_sheet, Doc, render_slide
"""

from __future__ import annotations

from .caption import PILLAR_TAGS, build_caption, contact_sheet, strip_markup
from .constants import H, W
from .doc import Doc
from .render import generate, render_slide

__all__ = [
    "generate", "render_slide", "Doc",
    "build_caption", "contact_sheet", "strip_markup", "PILLAR_TAGS",
    "W", "H",
]
