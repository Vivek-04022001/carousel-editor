// 7. ---------- views ----------
function renderPillars() {
  const box = $('pillars'); box.innerHTML = '';
  ['people','self','power'].forEach(key => {
    const p = state.pillars[key];
    box.appendChild(h('div', { class:'pillar' + (state.pillar === key ? ' active' : ''), onclick:() => { state.pillar = key; renderAll(); } },
      h('div', { class:'sw', style:{ background:p.accent } }),
      h('div', { class:'nm' }, p.label, h('small', {}, p.accent.toUpperCase()))));
  });
  $('brandDot').style.background = pillarAccent();
}
function plain(t) { return (t || '').replace(/\*\*|\[\/?[a-z]*=?[^\]]*\]/g, ''); }
function renderSlideList() {
  const list = $('slideList'); list.innerHTML = '';
  state.slides.forEach((s, i) => {
    const labels = { cover:s.title, cta:s.text, quote:s.quote, compare:(s.heading || s.labelA), term:s.term, interrupt:(s.line || s.kicker), recap:(s.title || s.kicker), body:s.heading };
    const label = labels[s.type] || `(${s.type})`;
    list.appendChild(h('div', { class:'slide-item' + (i === state.current ? ' active' : ''), onclick:() => { state.current = i; renderAll(); } },
      h('span', { class:'idx' }, String(i+1).padStart(2,'0')),
      h('span', { class:'label' }, plain(label)),
      h('span', { class:'badge' }, s.type)));
  });
}
function renderEditor() {
  const ed = $('editor'); ed.innerHTML = '';
  if (!state.slides.length) return;
  const s = activeSlide();
  $('selType').textContent = s.type;
  (Panels[s.type] || Panels.body)(s).forEach(r => ed.appendChild(r));
}
function guidesOverlay() {
  const m = state.layout.margin;
  return h('div', { class:'guides' },
    h('div', { class:'box', style:{ left:m+'px', top:m+'px', right:m+'px', bottom:m+'px' } }),
    h('div', { class:'vc', style:{ left:'50%', top:0, bottom:0, width:'1px' } }),
    h('div', { class:'hc', style:{ top:'50%', left:0, right:0, height:'1px' } }));
}
function renderPreview() {
  const el = $('preview');
  if (!state.slides.length) { el.innerHTML = ''; return; }
  const interactive = !!(state.ui && state.ui.canvasEdit);
  renderSlideInto(el, activeSlide(), { interactive });
  el.classList.toggle('ce-on', interactive);
  el.classList.toggle('tool-text', !!(state.ui && state.ui.tool === 'text'));
  if (state.ui.guides) el.appendChild(guidesOverlay());
  if (typeof Zoom !== 'undefined') Zoom.apply();        // scale + rulers + status (replaces fixed scale)
  $('previewIdx').textContent = state.current + 1;
  $('previewTotal').textContent = state.slides.length;
  ceDecorate();
  commitSoon();
}
function renderAll() {
  renderPillars(); renderSlideList(); renderEditor(); renderPreview();
  if (typeof renderLayers === 'function') renderLayers();
}
