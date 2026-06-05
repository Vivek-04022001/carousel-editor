"""The editor `state` wrapped in a small accessor object the layout engine uses."""

from __future__ import annotations

from .colors import blend_over, hex_rgb
from .constants import DARK_TYPES


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
