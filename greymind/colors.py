"""Colour + blend maths (ported from the editor, export-safe flat colour)."""

from __future__ import annotations


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
