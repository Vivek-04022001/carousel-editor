# The Grey Mind — Carousel Studio

Dark psychology · self-mastery · influence. A two-surface toolkit for designing and batch-rendering
1080×1350 Instagram carousels for **[@_thegreymind_](https://instagram.com/_thegreymind_)**.

---

## Surfaces

| Surface | What it does |
|---|---|
| `carousel_editor.html` | Browser-based visual editor — no build step, open the file and go |
| `carousel.py` | CLI Pillow renderer — takes the editor's JSON, outputs PNG/JPG slides |
| `lucid_to_editor.py` | Script-to-JSON converter — turn a Lucid plain-text carousel script into editor JSON |

---

## Design System

Three pillars, each with a signature colour:

| Pillar | Colour | Hex |
|---|---|---|
| POWER | Forest green | `#173D2C` |
| SELF | Midnight blue | `#18293F` |
| PEOPLE | Oxblood | `#6B1A1A` |

Cover / CTA / quote / interrupt / recap slides use the **pillar colour** as background.
Body / compare / term slides go **charcoal `#0a0a0a`** with a thin pillar-coloured left bar.

Typeface: **Space Grotesk** 300–700. Wordmark top-left, `NN/NN` counter bottom-right.

---

## Slide Types

`cover` · `body` · `cta` · `quote` · `compare` · `term` · `interrupt` · `recap`

---

## Quick Start

**Editor** — open the file, or serve it:

```bash
python -m http.server 8000
# open http://localhost:8000/carousel_editor.html
```

Design your deck → **Save JSON**.

**Render from CLI:**

```bash
python carousel.py my_deck.json --out output/my_deck --sheet --caption
```

`--sheet` adds a contact-sheet preview. `--caption` writes a starter caption + hashtags.

**Write with Lucid → render in one flow:**

```bash
python lucid_to_editor.py content_data/sample_lucid_script.txt --out content_data/my_carousel.json
python carousel.py content_data/my_carousel.json --out output/my_carousel --sheet --caption
```

---

## In-Canvas Editing

- **Click** a text block to select it
- **Double-click** to edit text in place
- **Drag** or **arrow-nudge** to reposition (snaps to 80px margins + centre; hold **Shift** to move freely)
- Per-word markup: `**bold**` · `[w=300]…[/w]` · `[c=#hex]…[/c]` · `[sz=80]…[/sz]`
- Undo/redo: `Ctrl+Z` / `Ctrl+Y`

---

## Files

```
carousel_editor.html     standalone visual editor
carousel.py              CLI renderer (Pillow)
lucid_to_editor.py       Lucid script → editor JSON
The Grey Mind.skill      Lucid brand voice + carousel structure
fonts/Space_Grotesk/     typeface
content_data/            sample JSON + Lucid scripts
output/                  rendered slides
features.md              roadmap + changelog
```

---

## Deploy

Static site, no build step. Deployed on Vercel — `vercel.json` rewrites `/` to the editor.
