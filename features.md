# Features & Improvements

Shared backlog for **The Grey Mind** carousel editor (`carousel_editor.html`).
Status: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Proposed by User

- [x] In-canvas editing — hover/click a text block **on the slide** to edit it in place — *done in Phase 2*
- [x] Blend modes for the eyebrow (Overlay etc.) — *done in Phase 1, export-safe*
- [x] Smoother adjustments + more options, everything under the user's control — *Phase 1*
- [x] **Sidebar width + button design + component-based code** — *done in the rebuild / Phase 1* (see Done below)
- [x] **Adobe-style "creative suite" UI** *(2026-06-03)* — Photoshop-style dock (tool rail · canvas · Properties/Layers/Slides · options + status bars), zoom/pan/rulers canvas, real Layers panel w/ show-hide. Done in Phase 5 below.
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

### Phase 5 — Adobe-style "creative suite" UI ✓ *(2026-06-03)*
Reorganized the shell into a Photoshop-style dock. Render engine (`renderers.js`, `state.js`, markup, export) reused; new `app.css` (frame chrome) + `js/app-shell.js` (zoom/pan/rulers · tools · dock · layers · status), no build step. All element IDs preserved so the existing modules kept working in place.

- [x] **5.1 App shell** — 5-zone CSS grid (`grid-template-areas`: opt / rail / canvas / dock / status) overriding the old `452px | 1fr` body grid. `app.css` adds neutral flattened-grey chrome tokens over `editor.css`'s brand-green ones.
- [x] **5.2 Tool rail** — left icon column: Move (V) · Edit-text (T) · Add-slide "shapes" flyout (the 8 types). `state.ui.tool` drives the cursor; **Text tool = single-click to edit in place** (hooked into `ceOnBlockDown`).
- [x] **5.3 Panel dock (right)** — collapsible **Properties** (selected-slide editor + format bar + Typography/Colour/Layout accordions + Document/Pillar/Project groups), **Layers**, **Slides**. Headers collapse on click; dock width is drag-resizable (280–560px).
- [x] **5.4 Layers panel** — per-type block list + chrome (`LAYER_FIELDS` in `app-shell.js`); click a row ⇄ `ceSelect(field)` (two-way highlight via `ceDecorate`), eye toggle = per-block `hidden` flag. **New `hidden` flag** honoured in `renderSlideInto` for *both* preview and export. *(Drag-reorder of layers deferred — block order is layout-driven, low value.)*
- [x] **5.5 Canvas workspace** — `#preview` wrapped in a zoom/pan viewport: **wheel = zoom toward cursor**, Space-drag / middle-drag = pan, `− % + Fit` controls, fit-to-window default, live **canvas rulers** (top/left, redraw on zoom/scroll/resize). Replaced the fixed `.preview-wrap` scale in `views.js`. **`#render-stage` untouched → export unaffected.**
- [x] **5.6 Options bar + status bar** — top bar = brand · slide nav · undo/redo · edit/guides toggles · visits · format + export. Bottom status bar = zoom % · selected-block x/y (or deck summary) · `1080×1350`.
- [x] **5.7 Polish + verify** — shortcuts (V/T/F · Ctrl +/−/0 zoom), draggable dock, narrow-screen dock-collapse CSS (<1100px). **Verified in headless Chrome (CDP):** all 9 slides export 1080×1350, distinct & non-blank; default-deck export is byte-identical to before (same SHA); `pos` offset + `hidden` now reach the PNG and clearing them restores the exact original hash. *(Deferred niceties: live slide-thumbnail previews in the Slides panel; a mobile button to slide the dock open.)*
- [x] **Dock UX polish** *(2026-06-03, user)* — "right sidebar isn't user-friendly: custom scrollbar + easier navigation." Replaced the chunky OS scrollbar with thin themed `::-webkit-scrollbar` / `scrollbar-width` styling across all dock + canvas scroll areas; rebalanced the dock so Properties/Layers/Slides each take a proportional flex share (`grow-2` / `grow-1`) and scroll independently, so Layers + Slides stay reachable instead of being squeezed to the bottom. Collapsing a panel header hands its space to the others.
- [x] **Properties sectioning** *(2026-06-03, user)* — "divide that menu into sections, add icons + good naming so the user knows what each is; collapse Typography by default." Properties body is now uniform icon-led collapsible `<details class="sect">` groups, each with a name + a right-aligned hint: ✏️ Content (open) · 🔤 Typography (now collapsed) · 🎨 Colours · ✨ Element effects · 📐 Layout & margins · 🎯 Pillar (open) · 🏷️ Brand · 💾 Project. Panel headers gained icons too (🎛️ Properties · 📑 Layers · 🗂️ Slides). All element IDs preserved, no JS change.
- [x] **Final-touch polish** *(2026-06-03, user)* — "icons feel childish; want professional single-colour icons + better sizing + micro-interactions that feel like magic." Replaced all emoji with an inline-SVG **line-icon set** (Lucide, MIT) driven by `currentColor` — one source of truth (`ICONS` map + `iconSvg()` + `data-icon` hydration in `app-shell.js`). Tool rail (cursor/type/plus), options bar (chevrons, undo/redo), panel headers (sliders/layers/grid), section icons (text/type/palette/blend/frame/columns/tag/save), layers eye, zoom ±. Added **micro-interactions**: section reveal slide-in, flyout pop, layer/slide hover-nudge, tool press-scale, rotating chevron disclosure, open-section icon glows brand-green, app fade-in — all gated by `prefers-reduced-motion`. Verified export SHA unchanged (`a4393c31…`).
- [x] **Bonus fix** — per-block drag `pos` offsets were silently dropped on **web** export (only applied when `interactive:true`); `carousel.py` already honoured them. `markEditable` now always applies offsets, so the web PNG matches the canvas + the Python renderer.

---

## Done

- [x] **Split into sub-modules** *(2026-06-03)* — user: "too many lines in `carousel.py` + `carousel_editor.html`, break into subcode if possible." Foundation for the Phase 5 dock work above (which already names these files).
  - **`carousel.py`** 533 → 67 lines (CLI only); engine moved to the **`greymind/`** package: `constants` · `fonts` · `colors` · `markup` · `doc` · `blocks` · `render` · `caption`. Verified **byte-identical** render of the sample deck (9 slides + contact sheet + caption) before vs after.
  - **`carousel_editor.html`** 1190 → 137 lines (shell only): `<style>` → `editor.css`; the one big script → 10 ordered classic `js/*.js` (helpers · state · renderers · editor · views · controls · history · export · canvas-edit · init) sharing global lexical scope; Firebase counter → `js/firebase.js` (ES module). No build step. Verified in headless Chrome: init runs; 9 slides + pillars + canvas-edit decorations render.
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
