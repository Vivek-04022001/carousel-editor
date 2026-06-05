// 10c. ---------- Adobe-style shell: zoom/pan/rulers · tools · dock · layers · status ----------
// Loaded after canvas-edit.js, before init.js. Defines globals (Zoom, renderLayers,
// updateStatus, iconSvg) that views.js / canvas-edit.js call at runtime.

/* =============================== ICONS =============================== */
// Single-colour line icons (Lucide, MIT). Drawn with currentColor so they inherit
// the surrounding text colour. Authored in HTML as <span data-icon="name"> and
// hydrated on load; built on demand in JS via iconSvg().
const ICONS = {
  cursor:   '<path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/>',
  type:     '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  plus:     '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus:    '<path d="M5 12h14"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  sliders:  '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  layers:   '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  grid:     '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  text:     '<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>',
  palette:  '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  blend:    '<circle cx="9" cy="9" r="7"/><circle cx="15" cy="15" r="7"/>',
  frame:    '<line x1="22" x2="2" y1="6" y2="6"/><line x1="22" x2="2" y1="18" y2="18"/><line x1="6" x2="6" y1="2" y2="22"/><line x1="18" x2="18" y1="2" y2="22"/>',
  columns:  '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  tag:      '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  save:     '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  eye:      '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  'eye-off':'<path d="M10.73 5.08a10.74 10.74 0 0 1 11.2 6.57 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49"/><path d="M14.08 14.16a3 3 0 0 1-4.24-4.24"/><path d="M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14"/><path d="m2 2 20 20"/>',
  undo:     '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo:     '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  'chevron-left':  '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down':  '<path d="m6 9 6 6 6-6"/>',
};
function iconSvg(name, size) {
  const p = ICONS[name]; if (!p) return '';
  const s = size || 18;
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(el => {
    const sz = el.getAttribute('data-size');
    el.innerHTML = iconSvg(el.getAttribute('data-icon'), sz ? +sz : undefined);
  });
}

/* =============================== ZOOM + PAN =============================== */
const Zoom = {
  min: 0.05, max: 4,
  fitValue() {
    const vp = $('viewport'); if (!vp) return 0.3;
    const aw = vp.clientWidth - 56, ah = vp.clientHeight - 56;     // minus .canvas-stage padding
    return clamp(Math.min(aw / 1080, ah / 1350), this.min, this.max);
  },
  current() { return state.ui.zoom != null ? state.ui.zoom : this.fitValue(); },
  set(z) { state.ui.zoom = clamp(z, this.min, this.max); this.apply(); },
  fit() { state.ui.zoom = null; this.apply(); },
  apply() {
    const z = this.current();
    const el = $('preview'), sizer = $('canvasSizer');
    if (sizer) { sizer.style.width = (1080 * z) + 'px'; sizer.style.height = (1350 * z) + 'px'; }
    if (el) { el.style.transformOrigin = 'top left'; el.style.transform = `scale(${z})`; }
    drawRulers(z);
    const pct = Math.round(z * 100) + '%';
    const zp = $('zoomPct'); if (zp) zp.textContent = pct;
    const sz = $('statusZoom'); if (sz) sz.textContent = pct;
    updateStatus();
  },
};
// Zoom toward a screen point (cursor). Correct in the scrollable regime (slide
// larger than viewport, where the flex auto-margins collapse to 0).
function zoomAtPoint(clientX, clientY, factor) {
  const vp = $('viewport'); if (!vp) return;
  const r = vp.getBoundingClientRect();
  const z0 = Zoom.current(), z1 = clamp(z0 * factor, Zoom.min, Zoom.max);
  if (z1 === z0) return;
  const cx = clientX - r.left, cy = clientY - r.top;
  const sx = (vp.scrollLeft + cx) / z0, sy = (vp.scrollTop + cy) / z0;   // slide coords under cursor
  Zoom.set(z1);
  vp.scrollLeft = sx * z1 - cx;
  vp.scrollTop  = sy * z1 - cy;
}

/* =============================== RULERS =============================== */
function drawRuler(cv, axis, z, origin) {
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  const len = axis === 'h' ? W : H, thick = axis === 'h' ? H : W;
  // pick a tick step (in slide px) so on-screen spacing is comfortable
  let step = 500;
  for (const s of [10, 25, 50, 100, 200, 250, 500, 1000]) { if (s * z >= 56) { step = s; break; } step = s; }
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.fillStyle = 'rgba(255,255,255,.42)';
  ctx.font = '9px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  ctx.lineWidth = 1;
  const first = Math.floor((-origin / z) / step) * step;
  for (let c = first; c * z + origin <= len + 1; c += step) {
    const p = Math.round(c * z + origin) + 0.5;
    if (p < 0) continue;
    ctx.beginPath();
    if (axis === 'h') { ctx.moveTo(p, thick); ctx.lineTo(p, thick - 7); } else { ctx.moveTo(thick, p); ctx.lineTo(thick - 7, p); }
    ctx.stroke();
    if (c < 0) continue;
    if (axis === 'h') { ctx.fillText(String(c), p + 3, 9); }
    else { ctx.save(); ctx.translate(9, p + 3); ctx.rotate(-Math.PI / 2); ctx.fillText(String(c), 0, 0); ctx.restore(); }
  }
}
function drawRulers(z) {
  const vp = $('viewport'), sizer = $('canvasSizer');
  if (!vp || !sizer) return;
  const vr = vp.getBoundingClientRect(), sr = sizer.getBoundingClientRect();
  drawRuler($('rulerH'), 'h', z, sr.left - vr.left);   // slide x=0 at the sizer's left edge
  drawRuler($('rulerV'), 'v', z, sr.top - vr.top);
}

/* =============================== TOOLS =============================== */
function setTool(tool) {
  state.ui.tool = tool;
  document.querySelectorAll('#toolrail .tool[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  const el = $('preview'); if (el) el.classList.toggle('tool-text', tool === 'text');
  $('viewport').classList.toggle('can-pan', false);
}
function bindTools() {
  $('toolMove').onclick = () => setTool('move');
  $('toolText').onclick = () => setTool('text');
  const fly = $('addFlyout'), addBtn = $('toolAdd');
  addBtn.onclick = e => { e.stopPropagation(); fly.classList.toggle('show'); };
  fly.querySelectorAll('button').forEach(b => b.addEventListener('click', () => fly.classList.remove('show')));
  document.addEventListener('mousedown', e => { if (!e.target.closest('.flyout-wrap')) fly.classList.remove('show'); });
}

/* =============================== DOCK (collapse + resize) =============================== */
function bindDock() {
  document.querySelectorAll('.panel > .phead').forEach(head => {
    head.addEventListener('click', () => head.parentElement.classList.toggle('collapsed'));
  });
  const res = $('dockResize'); let dragging = false;
  res.addEventListener('mousedown', e => { dragging = true; e.preventDefault(); document.body.style.cursor = 'col-resize'; });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = clamp(window.innerWidth - e.clientX, 280, 560);
    document.documentElement.style.setProperty('--dock-w', w + 'px');
    Zoom.apply();
  });
  document.addEventListener('mouseup', () => { if (dragging) { dragging = false; document.body.style.cursor = ''; } });
}

/* =============================== LAYERS =============================== */
const LAYER_FIELDS = {
  cover:   ['eyebrow', 'title'],
  body:    ['heading', 'body'],
  cta:     ['eyebrow', 'text'],
  quote:   ['eyebrow', 'quote', 'attribution'],
  compare: ['heading', 'labelA', 'textA', 'labelB', 'textB'],
  term:    ['eyebrow', 'term', 'definition', 'example'],
  interrupt: ['kicker', 'line'],
  recap:   ['kicker', 'title'],
};
const FIELD_LABEL = {
  title:'Title', heading:'Heading', body:'Body', text:'CTA line', eyebrow:'Eyebrow',
  quote:'Quote', attribution:'Attribution', labelA:'Label A', textA:'Text A', labelB:'Label B',
  textB:'Text B', term:'Term', definition:'Definition', example:'Example', kicker:'Kicker',
  line:'Line', wordmark:'Wordmark', counter:'Counter',
};
const CHROME_LAYERS = ['wordmark', 'counter'];

function fieldHiddenStore(field, create) {
  if (CHROME_LAYERS.includes(field)) { if (create && !state.layout.hidden) state.layout.hidden = {}; return state.layout.hidden; }
  const s = activeSlide(); if (create && !s.hidden) s.hidden = {}; return s.hidden;
}
function isFieldHidden(field) { const st = fieldHiddenStore(field, false); return !!(st && st[field]); }
function toggleFieldHidden(field) {
  const st = fieldHiddenStore(field, true);
  if (st[field]) delete st[field]; else st[field] = true;
  renderPreview(); renderLayers(); commitSoon();
}
function fieldHasContent(slide, field) {
  if (CHROME_LAYERS.includes(field)) return true;
  const v = slide[field];
  return v != null && String(v).trim() !== '';
}
function renderLayers() {
  const box = $('layersList'); if (!box) return;
  box.innerHTML = '';
  if (!state.slides.length) { $('layerCount').textContent = ''; return; }
  const slide = activeSlide();
  const fields = [...(LAYER_FIELDS[slide.type] || []), ...CHROME_LAYERS];
  fields.forEach(field => {
    const hidden = isFieldHidden(field), chrome = CHROME_LAYERS.includes(field), empty = !fieldHasContent(slide, field);
    const eye = h('button', { class:'eye' + (hidden ? ' off' : ''), title: hidden ? 'Show' : 'Hide', html: iconSvg(hidden ? 'eye-off' : 'eye', 16) });
    eye.addEventListener('click', e => { e.stopPropagation(); toggleFieldHidden(field); });
    const row = h('div', {
      class: 'layer' + (field === ceField ? ' active' : '') + (hidden ? ' hidden' : '') + (chrome ? ' chrome' : '') + (empty ? ' empty' : ''),
      onclick: () => {
        if (!state.ui.canvasEdit) { state.ui.canvasEdit = true; const c = $('canvasChk'); if (c) c.checked = true; }
        if (hidden) { toggleFieldHidden(field); }     // unhide so it can be selected
        ceSelect(field);
      },
    },
      eye,
      h('span', { class:'lname' }, FIELD_LABEL[field] || field),
      h('span', { class:'lkind' }, chrome ? 'chrome' : 'text'));
    box.appendChild(row);
  });
  $('layerCount').textContent = fields.length + ' blocks';
}

/* =============================== STATUS BAR =============================== */
function updateStatus() {
  const sel = $('statusSel'); if (!sel) return;
  if (typeof ceField !== 'undefined' && ceField) {
    const p = (typeof cePos === 'function') ? cePos(ceField) : { x:0, y:0 };
    sel.innerHTML = `<strong>${FIELD_LABEL[ceField] || ceField}</strong> · x ${p.x} y ${p.y}`;
  } else {
    sel.textContent = state.slides.length ? `${state.slides.length} slides · ${activeSlide().type}` : 'No selection';
  }
  const sc = $('slideCount'); if (sc) sc.textContent = state.slides.length + ' slides';
}

/* =============================== EVENT WIRING =============================== */
(function bindShell() {
  hydrateIcons();      // swap all <span data-icon> placeholders for inline SVG
  bindTools();
  bindDock();

  const vp = $('viewport');
  // wheel = zoom toward cursor (Adobe-style); shift+wheel / no-ctrl still zooms
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAtPoint(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  // pan: hold Space then drag, or middle-mouse drag
  let spaceDown = false, panning = false, px = 0, py = 0, sl = 0, st = 0;
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !(typeof ceEditing !== 'undefined' && ceEditing)) {
      spaceDown = true; vp.classList.add('can-pan'); e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; vp.classList.remove('can-pan'); } });
  vp.addEventListener('mousedown', e => {
    if (!(spaceDown || e.button === 1)) return;
    panning = true; px = e.clientX; py = e.clientY; sl = vp.scrollLeft; st = vp.scrollTop;
    vp.classList.add('panning'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!panning) return;
    vp.scrollLeft = sl - (e.clientX - px); vp.scrollTop = st - (e.clientY - py);
    drawRulers(Zoom.current());
  });
  document.addEventListener('mouseup', () => { if (panning) { panning = false; vp.classList.remove('panning'); } });
  vp.addEventListener('scroll', () => drawRulers(Zoom.current()));

  // zoom controls
  $('zoomIn').onclick  = () => Zoom.set(Zoom.current() * 1.2);
  $('zoomOut').onclick = () => Zoom.set(Zoom.current() / 1.2);
  $('zoomFit').onclick = () => Zoom.fit();
  $('zoomPct').onclick = () => Zoom.fit();

  // keyboard: tools + zoom (only when not typing / editing)
  document.addEventListener('keydown', e => {
    const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) || (typeof ceEditing !== 'undefined' && ceEditing);
    if (typing) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); Zoom.set(Zoom.current() * 1.2); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); Zoom.set(Zoom.current() / 1.2); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); Zoom.fit(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'v' || e.key === 'V') setTool('move');
    else if (e.key === 't' || e.key === 'T') setTool('text');
    else if (e.key === 'f' || e.key === 'F') Zoom.fit();
  });

  // re-fit on window resize when in fit mode; always keep rulers aligned
  let rt = null;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => Zoom.apply(), 80); });
})();
