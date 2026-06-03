# Features & Improvements

Shared backlog for **The Grey Mind** carousel editor (`carousel_editor.html`).
Status: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Proposed by User

- [x] In-canvas editing — hover/click a text block **on the slide** to edit it in place — *done in Phase 2*
- [x] Blend modes for the eyebrow (Overlay etc.) — *done in Phase 1, export-safe*
- [x] Smoother adjustments + more options, everything under the user's control — *Phase 1*
- [x] **Sidebar width + button design + component-based code** — *done in the rebuild / Phase 1* (see Done below)
- [ ] (drop new ideas here)

---

## Roadmap (Claude)

### Phase 2 — In-canvas editing ✓ *(2026-06-03)*
- [x] Click a text block on the slide → select + floating toolbar (B/M/L weight · colour · size · nudge)
- [x] In-place editable text (contenteditable) with markup round-trip — verified: `**bold**`/`[w]`/`[c]`/`[sz]` survive an edit cycle
- [x] Drag-to-move + arrow-key nudge (per-element x/y offset; text blocks store on the slide as `pos`, chrome stores globally in `layout.pos`)
- [x] Snap to the 80px margins / horizontal + vertical centre while dragging (hold **Shift** to move freely; green guide shows the snap line)
- [x] Move the eyebrow / wordmark / counter chrome too (select + drag/nudge; chrome isn't text-editable)

### Phase 3 — More slide types (from the Lucid content toolkit) ✓ *(2026-06-03)*
- [x] **Quote slide** — big statement on the pillar colour: optional eyebrow, decorative “ mark, mixed-weight quote, optional attribution. Full markup + in-canvas editing + typography controls. Migration backfills the new typography keys onto older saves.
- [x] **Compare slide** — two-part contrast (the trap vs the move) on charcoal with the left bar: heading + two colour-coded label/text halves (red/green defaults, per-side colour pickers) + divider. All five text blocks markup + in-canvas editable; typography controls + migration.
- [x] **Term + Definition slide** — defines one concept on charcoal: optional eyebrow, big term, pillar-coloured accent rule, definition, optional muted-italic example. All four text blocks markup + in-canvas editable; typography controls + migration.
- [x] **Pattern-interrupt slide** — a jolt mid-carousel: uppercase kicker + one big imperative line, centred on the pillar colour. Kicker + line in-canvas editable; typography controls.
- [x] **Recap "save this" slide** — top-aligned on the pillar colour: kicker + title + a takeaway list (one per line, markup per line) with pillar-muted dash markers + an "Auto-fill from slides" button. Kicker + title in-canvas editable (list edited in the sidebar); typography controls.

### Phase 4 — Pipeline
- [x] **Align `carousel.py` to the rebrand** *(2026-06-03)* — full Pillow port of the editor's renderer: consumes the editor's JSON `state` export, all 8 slide types, Space Grotesk weights, per-word markup, markup-aware word-wrap within margins, blend-computed chrome colours, left bar, pillar/charcoal backgrounds, per-block `pos` offsets. Verified by rendering the sample deck and eyeballing parity with the editor.
- [x] **`README.md`** *(2026-06-03)* — rewritten for The Grey Mind (pillars, types, in-canvas editing, CLI usage).
- [x] **Contact-sheet preview** *(2026-06-03)* — `--sheet` writes `contact_sheet.png` (grid montage of the whole deck).
- [x] **Caption + hashtag export** *(2026-06-03)* — `--caption` writes a starter `caption.txt` (cover hook + CTA + pillar hashtags) to edit before posting.
- [x] **Lucid skill → editor JSON** *(2026-06-03)* — `lucid_to_editor.py`: Lucid writes a carousel as a short plain-text script (header → `== body/quote/compare/term/interrupt/recap/cta ==` blocks, mirroring the skill's carousel order); the converter emits a full editor `state` JSON that's both editor-loadable and `carousel.py`-renderable. Reuses `the_grey_mind_sample.json` as the config base (no drift). Example: `content_data/sample_lucid_script.txt`. Verified end-to-end: script → JSON → 9 rendered slides + contact sheet.

---

## Done

- [x] **The Grey Mind rebuild** *(2026-06-03)* — editor rebuilt for the rebrand: 3 pillars (POWER green / SELF navy / PEOPLE oxblood), Space Grotesk, 80px margins, cover/body/cta slide types, mixed-weight titles, per-word markup (`**bold**` / `[w=]` / `[c=]` / `[sz=]`) + selection toolbar, eyebrow category dropdowns. Verified against the reference designs via headless-Chrome render.
- [x] **UI / sidebar polish** *(2026-06-03)* — user feedback: "sidebar congested, widen it + better buttons + component-based code for easy debugging":
  - **Sidebar widened** to `452px` (from 360px); roomier padding.
  - **Buttons redesigned** — `10px` radius, hover lift, and `.primary` / `.ghost` / `.danger` / `.mini` variants; add-row is a clean grid.
  - **Component-based architecture** — `h()` hyperscript helper + concern-split modules (`Views` render per type, `Panels` editor fields, `renderSlideInto`, `rebuildGrids`, `EditorPanels`), no framework / no build step. Makes each slide type a small isolated unit.
- [x] **Phase 1 — full control + fixes** *(2026-06-03)*:
  - CTA controls fixed (all field types + format toolbar now consistent across cover/body/cta).
  - **Export-safe blend modes** for eyebrow / wordmark / counter (Overlay · Soft-Light · Multiply · Screen · …). Computed to a flat colour because `html-to-image` drops `mix-blend-mode` on export (verified: it came out blank).
  - **Slider + number** controls everywhere (smooth, fine steps); **line-height** front-and-centre (Typography open by default).
  - Safe-area **guides** toggle · **autosave** (localStorage) · **undo/redo** (Ctrl+Z / Ctrl+Y).
  - **Fresh-node export fix** — reusing one render node made "Download all" produce blanks after the first slide.

### Legacy (old MillionaireMoveX gray design — superseded by the rebrand)
- [x] Open-loop cover hook · NN/NN counter + progress bar · `**bold**` keyword styling · cover hierarchy + swipe cue *(May 2026)*
