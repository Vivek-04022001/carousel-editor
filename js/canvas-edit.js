// 10b. ---------- in-canvas editing (select · drag/nudge · in-place text) ----------
let ceField = null;     // dataset.field of the selected block (null = nothing selected)
let ceEditing = false;  // true while a block is contenteditable
let ceSnap = { x:null, y:null };   // active snap-guide positions (slide coords) during a drag

const CHROME_FIELDS = ['wordmark', 'counter'];   // positioned globally (layout.pos), not per-slide
function ceBlocks() { return $('preview').querySelectorAll('.ce-block'); }
function ceFindBlock(field) { return [...ceBlocks()].find(b => b.dataset.field === field); }
function posStore(field, create) {
  if (CHROME_FIELDS.includes(field)) { if (create && !state.layout.pos) state.layout.pos = {}; return state.layout.pos; }
  const s = activeSlide(); if (create && !s.pos) s.pos = {}; return s.pos;
}
function cePos(field) { const st = posStore(field, false); return (st && st[field]) || { x:0, y:0 }; }
function ceSetPos(field, x, y) {
  posStore(field, true)[field] = { x: Math.round(x), y: Math.round(y) };
  renderPreview();
}
function ceResetPos(field) {
  const st = posStore(field, false);
  if (st) { delete st[field]; if (!Object.keys(st).length && !CHROME_FIELDS.includes(field)) delete activeSlide().pos; }
  renderPreview(); commitSoon();
}

// Re-runs after every preview render: re-binds listeners + restores selection outline/toolbar.
function ceDecorate() {
  if (!(state.ui && state.ui.canvasEdit)) { ceHideToolbar(); return; }
  ceBlocks().forEach(b => {
    b.addEventListener('mousedown', ceOnBlockDown);
    b.addEventListener('dblclick', ceOnBlockDbl);
  });
  if (ceField) {
    const b = ceFindBlock(ceField);
    if (b) { b.classList.add('ce-sel'); cePlaceToolbar(b); }
    else { ceField = null; ceEditing = false; ceHideToolbar(); }
  }
  if (ceSnap.x != null) $('preview').appendChild(h('div', { class:'ce-guide v', style:{ left:ceSnap.x + 'px' } }));
  if (ceSnap.y != null) $('preview').appendChild(h('div', { class:'ce-guide h', style:{ top:ceSnap.y + 'px' } }));
  if (typeof renderLayers === 'function') renderLayers();   // keep the Layers panel highlight in sync
  if (typeof updateStatus === 'function') updateStatus();
}
function ceSelect(field) { ceEditing = false; ceField = field; renderPreview(); }
function ceDeselect() { ceField = null; ceEditing = false; ceHideToolbar(); renderPreview(); }
function ceNudge(key, step) {
  const p = cePos(ceField);
  let { x, y } = p;
  if (key === 'ArrowLeft') x -= step; else if (key === 'ArrowRight') x += step;
  else if (key === 'ArrowUp') y -= step; else if (key === 'ArrowDown') y += step;
  ceSetPos(ceField, x, y); commitSoon();
}

// ---- drag to move (with snap to margins / centre) ----
const SLIDE_W = 1080, SLIDE_H = 1350, SNAP_TH = 14;
function snapAxis(edges, targets) {
  let best = null;
  for (const t of targets) for (const edge of edges) {
    const d = Math.abs(edge - t);
    if (d <= SNAP_TH && (!best || d < best.d)) best = { d, corr: t - edge, guide: t };
  }
  return best;
}
function ceOnBlockDown(e) {
  if (ceEditing) return;                       // in edit mode, let the browser select text
  const field = e.currentTarget.dataset.field;
  // Text tool: a single click goes straight into in-place editing (chrome stays select-only).
  if (state.ui.tool === 'text' && !CHROME_FIELDS.includes(field)) { e.preventDefault(); ceOnBlockDbl({ currentTarget: e.currentTarget }); return; }
  if (field !== ceField) ceSelect(field);
  e.preventDefault();
  const sr = $('preview').getBoundingClientRect(), scale = sr.width / 1080;
  const sx = e.clientX, sy = e.clientY, base = cePos(field);
  const liveBlock = ceFindBlock(field) || e.currentTarget;
  liveBlock.classList.add('ce-drag');
  const br = liveBlock.getBoundingClientRect();
  // geometry at offset 0, in slide coords
  const natL = (br.left - sr.left) / scale - base.x, natT = (br.top - sr.top) / scale - base.y;
  const bw = br.width / scale, bh = br.height / scale, m = state.layout.margin;
  let moved = false;
  function move(ev) {
    if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 3) return;
    moved = true;
    let px = base.x + (ev.clientX - sx) / scale, py = base.y + (ev.clientY - sy) / scale;
    if (ev.shiftKey) { ceSnap = { x:null, y:null }; }   // hold Shift to move freely
    else {
      const L = natL + px, T = natT + py;
      const sX = snapAxis([L, L + bw / 2, L + bw], [m, SLIDE_W / 2, SLIDE_W - m]);
      const sY = snapAxis([T, T + bh / 2, T + bh], [m, SLIDE_H / 2, SLIDE_H - m]);
      if (sX) px += sX.corr;
      if (sY) py += sY.corr;
      ceSnap = { x: sX ? sX.guide : null, y: sY ? sY.guide : null };
    }
    ceSetPos(field, px, py);
  }
  function up() {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    ceSnap = { x:null, y:null };
    if (moved) { renderPreview(); commitSoon(); }
  }
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// ---- in-place text editing ----
function ceOnBlockDbl(e) {
  const b = e.currentTarget;
  if (CHROME_FIELDS.includes(b.dataset.field)) { ceSelect(b.dataset.field); return; }  // chrome: select, not text-edit
  ceField = b.dataset.field; ceEditing = true;
  b.classList.add('ce-sel', 'ce-editing');
  b.setAttribute('contenteditable', 'true');
  b.style.cursor = 'text';
  b.focus();
  b.addEventListener('keydown', ceEditKeydown);
  b.addEventListener('blur', ceCommitEdit, { once:true });
  cePlaceToolbar(b);
}
function ceEditKeydown(e) {
  e.stopPropagation();                         // shield global undo/nudge/nav
  if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.blur(); }
}
function ceCommitEdit(e) {
  const b = e.target, field = b.dataset.field;
  const markup = serializeBlock(b);
  b.removeAttribute('contenteditable');
  b.classList.remove('ce-editing');
  b.removeEventListener('keydown', ceEditKeydown);
  ceEditing = false;
  activeSlide()[field] = markup;
  renderEditor(); renderSlideList(); renderPreview(); commitSoon();
}

// DOM (rich spans from parseMarkup or toolbar wraps) → our markup string.
function cssColorToHex(c) {
  if (!c) return null;
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
  if (m) return rgbToHex(+m[1], +m[2], +m[3]);
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
  return null;
}
function styleWraps(el) {
  let pre = '', suf = '';
  const st = el.style || {};
  const sz = parseInt(st.fontSize, 10);
  if (sz) { pre += `[sz=${sz}]`; suf = '[/sz]' + suf; }
  const hx = cssColorToHex(st.color);
  if (hx) { pre += `[c=${hx}]`; suf = '[/c]' + suf; }
  const w = String(st.fontWeight || '');
  if (w === '700' || w === 'bold') { pre += '**'; suf = '**' + suf; }
  else if (w && w !== '400' && w !== 'normal') { pre += `[w=${w}]`; suf = '[/w]' + suf; }
  return { pre, suf };
}
function serializeBlock(root) {
  let out = '';
  (function walk(node) {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === 'BR') { out += '\n'; return; }
      if ((tag === 'DIV' || tag === 'P') && out && !out.endsWith('\n')) out += '\n';
      const w = styleWraps(n);
      out += w.pre; walk(n); out += w.suf;
    });
  })(root);
  return out.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').replace(/\s+$/, '');
}

// ---- floating toolbar ----
function ceHideToolbar() { const tb = $('ceToolbar'); if (tb) tb.classList.remove('show'); }
function ceWrapSel(styleObj) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  const span = document.createElement('span');
  Object.assign(span.style, styleObj);
  try { range.surroundContents(span); }
  catch (_) { span.appendChild(range.extractContents()); range.insertNode(span); }
  const r2 = document.createRange(); r2.selectNodeContents(span);
  sel.removeAllRanges(); sel.addRange(r2);
}
function ceBtn(label, title, onclick, opts = {}) {
  const b = h('button', { title, class: opts.cls || '' }, opts.html ? '' : label);
  if (opts.html) b.innerHTML = label;
  b.onmousedown = e => e.preventDefault();   // keep focus in the editable / block selection
  b.onclick = onclick;
  return b;
}
function buildToolbar() {
  const tb = $('ceToolbar'); tb.innerHTML = '';
  if (ceEditing) {
    const colour = h('input', { type:'color', value:'#F5F5F5', title:'Highlight colour' });
    colour.onmousedown = e => e.preventDefault();
    colour.oninput = () => ceWrapSel({ color: colour.value });
    const size = h('input', { type:'number', min:10, max:200, value:state.type[ceField === 'text' ? 'cta' : ceField]?.size || 60, title:'Size (px)' });
    size.onmousedown = e => e.preventDefault();
    tb.append(
      ceBtn('<b>B</b>', 'Bold (700)', () => ceWrapSel({ fontWeight:'700' }), { html:true }),
      ceBtn('M', 'Medium (500)', () => ceWrapSel({ fontWeight:'500' })),
      ceBtn('L', 'Light (300)', () => ceWrapSel({ fontWeight:'300' })),
      h('span', { class:'vline' }), colour,
      h('span', { class:'vline' }), size,
      ceBtn('px', 'Apply size', () => ceWrapSel({ fontSize: size.value + 'px' })),
      h('span', { class:'vline' }),
      ceBtn('Done', 'Finish editing (Esc)', () => { const b = ceFindBlock(ceField); if (b) b.blur(); }, { cls:'on' }),
    );
  } else {
    const nudge = h('div', { class:'nudge' },
      ceBtn('◀', 'Nudge left', () => ceNudge('ArrowLeft', 4)),
      ceBtn('▲', 'Nudge up', () => ceNudge('ArrowUp', 4)),
      ceBtn('▼', 'Nudge down', () => ceNudge('ArrowDown', 4)),
      ceBtn('▶', 'Nudge right', () => ceNudge('ArrowRight', 4)));
    const editBtn = CHROME_FIELDS.includes(ceField) ? null
      : ceBtn('Edit text', 'Edit this block in place (or double-click it)', () => { const b = ceFindBlock(ceField); if (b) ceOnBlockDbl({ currentTarget:b }); }, { cls:'on' });
    tb.append(...[
      editBtn, editBtn && h('span', { class:'vline' }), nudge,
      h('span', { class:'vline' }),
      ceBtn('Reset pos', 'Clear this block’s offset', () => ceResetPos(ceField)),
    ].filter(Boolean));
  }
}
function cePlaceToolbar(b) {
  const tb = $('ceToolbar');
  buildToolbar();
  tb.classList.add('show');
  tb.style.visibility = 'hidden';
  const r = b.getBoundingClientRect(), tw = tb.offsetWidth, th = tb.offsetHeight;
  let top = r.top - th - 10; if (top < 8) top = r.bottom + 10;
  let left = r.left + r.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  tb.style.top = top + 'px'; tb.style.left = left + 'px';
  tb.style.visibility = 'visible';
}

// click anywhere outside a block / the toolbar → deselect (capture: runs before block mousedown)
document.addEventListener('mousedown', e => {
  if (!(state.ui && state.ui.canvasEdit) || !ceField) return;
  if (e.target.closest && (e.target.closest('#preview .ce-block') || e.target.closest('#ceToolbar'))) return;
  if (ceEditing) return;                       // blur handler commits the edit
  ceDeselect();
}, true);

$('canvasChk').onchange = e => { state.ui.canvasEdit = e.target.checked; if (!e.target.checked) { ceField = null; ceEditing = false; } renderPreview(); };
