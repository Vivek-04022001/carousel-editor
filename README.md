# Carousel Editor

A browser-based editor for designing **1080×1350** Instagram carousel slides, with a clean Apple-style interface. Edit cover and body slides, pick themes and typography, preview live, and export every slide as PNG/JPG (single image or a ZIP of the whole set).

## Live site

Deployed on Vercel — the editor is served at the root URL (`/`).

## Run locally

It's a single static file. Just open it in a browser:

```
carousel_editor.html
```

Or serve the folder with any static server:

```bash
python -m http.server 8000
# then open http://localhost:8000/carousel_editor.html
```

## Features

- Cover + body slide types with live 1080×1350 preview
- Theme presets (dark, light, black, cream, navy) plus per-slide overrides
- Adjustable fonts (Montserrat, Mulish, Inter, Poppins, Playfair Display), weights, and sizes
- Inline `**bold**` accent syntax
- Brand header, progress footer, and swipe cue
- Export current slide or all slides as a ZIP (PNG / JPG)
- Save / load projects as JSON

## Project files

- `carousel_editor.html` — the standalone editor (served at `/` on Vercel)
- `carousel.py` — Python + Pillow generator for batch-rendering slides
- `fonts/`, `content_data/`, `Content/`, `output/` — assets and generated output

## Deploy

Static site, no build step. `vercel.json` rewrites `/` to the editor.
