// 4. ---------- renderers ----------
function chromeWordmark(slide) {
  const t = state.type.wordmark, m = state.layout.margin;
  return h('div', { class:'wordmark', style:{ left:m+'px', top:m+'px', fontSize:t.size+'px', fontWeight:t.weight, letterSpacing:track(t.track), color:elColor('wordmark', slide) } }, state.wordmark);
}
function chromeCounter(slide, idx, total) {
  const t = state.type.counter, m = state.layout.margin;
  const label = `${String(idx+1).padStart(2,'0')}/${String(total).padStart(2,'0')}`;
  return h('div', { class:'counter', style:{ right:m+'px', bottom:m+'px', fontSize:t.size+'px', fontWeight:t.weight, letterSpacing:track(t.track), color:elColor('counter', slide) } }, label);
}
function leftBar() { return state.colors.barShow ? h('div', { class:'leftbar', style:{ width:state.colors.barWidth+'px', background:pillarAccent() } }) : null; }

function eyebrowEl(slide) {
  const ty = state.type.eyebrow;
  return h('p', { class:'eyebrow', style:{ fontSize:ty.size+'px', fontWeight:ty.weight, letterSpacing:track(ty.track), marginBottom:ty.gap+'px', color:elColor('eyebrow', slide) } }, slide.eyebrow.trim());
}
const Views = {
  cover(slide, content) {
    const ty = state.type;
    if (slide.eyebrow && slide.eyebrow.trim()) content.appendChild(eyebrowEl(slide));
    content.appendChild(rich('h1','title', slide.title, { fontSize:ty.title.size+'px', fontWeight:ty.title.weight, lineHeight:ty.title.lh+'px', letterSpacing:track(ty.title.track), color:state.colors.text }));
  },
  body(slide, content) {
    const ty = state.type;
    content.appendChild(rich('h2','heading', slide.heading, { fontSize:ty.heading.size+'px', fontWeight:ty.heading.weight, lineHeight:ty.heading.lh+'px', letterSpacing:track(ty.heading.track), marginBottom:ty.heading.gap+'px', color:state.colors.text }));
    content.appendChild(rich('p','body', slide.body, { fontSize:ty.body.size+'px', fontWeight:ty.body.weight, lineHeight:ty.body.lh+'px', letterSpacing:track(ty.body.track), color:state.colors.text }));
  },
  cta(slide, content) {
    const ty = state.type;
    if (slide.eyebrow && slide.eyebrow.trim()) content.appendChild(eyebrowEl(slide));
    content.appendChild(rich('p','ctaline', slide.text, { fontSize:ty.cta.size+'px', fontWeight:ty.cta.weight, lineHeight:ty.cta.lh+'px', letterSpacing:track(ty.cta.track), color:state.colors.text }));
  },
  quote(slide, content) {
    const ty = state.type;
    if (slide.eyebrow && slide.eyebrow.trim()) content.appendChild(eyebrowEl(slide));
    if (ty.quotemark.size > 0)
      content.appendChild(h('div', { class:'quotemark', style:{ fontSize:ty.quotemark.size+'px', fontWeight:ty.quotemark.weight, marginBottom:ty.quotemark.gap+'px', color:elColor('eyebrow', slide) } }, '“'));
    content.appendChild(rich('p','quote', slide.quote, { fontSize:ty.quote.size+'px', fontWeight:ty.quote.weight, lineHeight:ty.quote.lh+'px', letterSpacing:track(ty.quote.track), color:state.colors.text }));
    if (slide.attribution && slide.attribution.trim())
      content.appendChild(rich('p','attribution', slide.attribution, { fontSize:ty.attribution.size+'px', fontWeight:ty.attribution.weight, letterSpacing:track(ty.attribution.track), marginTop:ty.attribution.gap+'px', color:elColor('eyebrow', slide) }));
  },
  compare(slide, content) {
    const ty = state.type, cA = slide.colorA || '#C8553D', cB = slide.colorB || '#3E9E6E';
    if (slide.heading && slide.heading.trim())
      content.appendChild(rich('h2','heading', slide.heading, { fontSize:ty.heading.size+'px', fontWeight:ty.heading.weight, lineHeight:ty.heading.lh+'px', letterSpacing:track(ty.heading.track), marginBottom:'30px', color:state.colors.text }));
    const half = (lblCls, txtCls, label, txt, color) => {
      if (label != null && String(label).trim())
        content.appendChild(rich('p', lblCls, label, { fontSize:ty.compareLabel.size+'px', fontWeight:ty.compareLabel.weight, letterSpacing:track(ty.compareLabel.track), marginBottom:ty.compareLabel.gap+'px', color }));
      content.appendChild(rich('p', txtCls, txt, { fontSize:ty.compareText.size+'px', fontWeight:ty.compareText.weight, lineHeight:ty.compareText.lh+'px', letterSpacing:track(ty.compareText.track), color:state.colors.text }));
    };
    half('labelA', 'textA', slide.labelA, slide.textA, cA);
    content.appendChild(h('div', { class:'cmp-div', style:{ background:elColor('eyebrow', slide) } }));
    half('labelB', 'textB', slide.labelB, slide.textB, cB);
  },
  term(slide, content) {
    const ty = state.type;
    if (slide.eyebrow && slide.eyebrow.trim()) content.appendChild(eyebrowEl(slide));
    content.appendChild(rich('h2','term', slide.term, { fontSize:ty.term.size+'px', fontWeight:ty.term.weight, lineHeight:ty.term.lh+'px', letterSpacing:track(ty.term.track), color:state.colors.text }));
    if (ty.term.ruleW > 0)
      content.appendChild(h('div', { class:'term-rule', style:{ width:ty.term.ruleW+'px', height:'6px', background:pillarAccent(), marginTop:'26px', marginBottom:ty.term.gap+'px' } }));
    content.appendChild(rich('p','definition', slide.definition, { fontSize:ty.definition.size+'px', fontWeight:ty.definition.weight, lineHeight:ty.definition.lh+'px', letterSpacing:track(ty.definition.track), color:state.colors.text }));
    if (slide.example && slide.example.trim())
      content.appendChild(rich('p','example', slide.example, { fontSize:ty.example.size+'px', fontWeight:ty.example.weight, letterSpacing:track(ty.example.track), marginTop:ty.example.gap+'px', color:elColor('eyebrow', slide) }));
  },
  interrupt(slide, content) {
    const ty = state.type;
    if (slide.kicker && slide.kicker.trim())
      content.appendChild(rich('p','ikicker', slide.kicker, { fontSize:ty.interruptKicker.size+'px', fontWeight:ty.interruptKicker.weight, letterSpacing:track(ty.interruptKicker.track), marginBottom:ty.interruptKicker.gap+'px', color:elColor('eyebrow', slide) }));
    content.appendChild(rich('p','interrupt', slide.line, { fontSize:ty.interrupt.size+'px', fontWeight:ty.interrupt.weight, lineHeight:ty.interrupt.lh+'px', letterSpacing:track(ty.interrupt.track), color:state.colors.text }));
  },
  recap(slide, content) {
    const ty = state.type;
    if (slide.kicker && slide.kicker.trim())
      content.appendChild(rich('p','rkicker', slide.kicker, { fontSize:ty.recapKicker.size+'px', fontWeight:ty.recapKicker.weight, letterSpacing:track(ty.recapKicker.track), marginBottom:ty.recapKicker.gap+'px', color:elColor('eyebrow', slide) }));
    if (slide.title && slide.title.trim())
      content.appendChild(rich('h2','rtitle', slide.title, { fontSize:ty.recapTitle.size+'px', fontWeight:ty.recapTitle.weight, lineHeight:ty.recapTitle.lh+'px', letterSpacing:track(ty.recapTitle.track), color:state.colors.text }));
    const list = h('ul', { class:'recap-list', style:{ marginTop:ty.recapTitle.gap+'px' } });
    (slide.items || []).forEach(it => {
      if (!String(it).trim()) return;
      const li = h('li', { class:'recap-item', style:{ fontSize:ty.recapItem.size+'px', fontWeight:ty.recapItem.weight, lineHeight:ty.recapItem.lh+'px', letterSpacing:track(ty.recapItem.track), marginBottom:ty.recapItem.gap+'px', color:state.colors.text } });
      li.appendChild(h('span', { class:'rmark', style:{ color:elColor('eyebrow', slide) } }, '—'));
      const txt = h('span'); txt.innerHTML = parseMarkup(it); li.appendChild(txt);
      list.appendChild(li);
    });
    content.appendChild(list);
  },
};
function renderSlideInto(el, slide, opts = {}) {
  const m = state.layout.margin;
  el.style.background = slideBg(slide);
  el.style.fontFamily = "'Space Grotesk', sans-serif";
  el.innerHTML = '';
  const idx = (opts.index != null) ? opts.index : state.current;
  const total = (opts.total != null) ? opts.total : state.slides.length;
  if (DARK_TYPES.includes(slide.type)) { const b = leftBar(); if (b) el.appendChild(b); }
  const wm = chromeWordmark(slide);
  const centered = !TOP_TYPES.includes(slide.type);
  const shift = slide.type === 'cover' ? state.layout.coverShift : slide.type === 'cta' ? state.layout.ctaShift : slide.type === 'quote' ? state.layout.quoteShift : slide.type === 'interrupt' ? state.layout.interruptShift : 0;
  const tops = { compare: state.layout.compareTop, term: state.layout.termTop, recap: state.layout.recapTop };
  const topPx = (tops[slide.type] || state.layout.bodyTop) + 'px';
  const content = h('div', { class:'content' + (centered ? ' center' : ''), style:{ left:m+'px', right:m+'px', top:centered ? `calc(50% + ${shift}px)` : topPx } });
  (Views[slide.type] || Views.body)(slide, content);
  const ct = chromeCounter(slide, idx, total);
  // tag + apply per-block offsets + prune hidden blocks — always (preview AND export),
  // so drag-moved positions and show/hide are reflected in the rendered PNG too.
  markEditable(content, slide);
  el.appendChild(content);
  if (!blockHidden(slide, 'wordmark')) { tagChrome(wm, 'wordmark'); el.appendChild(wm); }
  if (!blockHidden(slide, 'counter')) { tagChrome(ct, 'counter'); el.appendChild(ct); }
}
// is a block currently hidden? chrome → layout.hidden, content → slide.hidden
function blockHidden(slide, field) {
  if (field === 'wordmark' || field === 'counter') return !!(state.layout.hidden && state.layout.hidden[field]);
  return !!(slide.hidden && slide.hidden[field]);
}
// class on the rendered block → the slide property it edits
const BLOCK_FIELD = { title:'title', heading:'heading', body:'body', ctaline:'text', eyebrow:'eyebrow', quote:'quote', attribution:'attribution', labelA:'labelA', textA:'textA', labelB:'labelB', textB:'textB', term:'term', definition:'definition', example:'example', ikicker:'kicker', interrupt:'line', rkicker:'kicker', rtitle:'title' };
const BLOCK_CLASSES = Object.keys(BLOCK_FIELD);
function applyOffset(el, p) { if (p && (p.x || p.y)) el.style.transform = `${el.style.transform ? el.style.transform + ' ' : ''}translate(${p.x}px, ${p.y}px)`; }
function markEditable(content, slide) {
  content.querySelectorAll('.' + BLOCK_CLASSES.join(',.')).forEach(b => {
    const cls = BLOCK_CLASSES.find(c => b.classList.contains(c));
    const field = BLOCK_FIELD[cls];
    if (blockHidden(slide, field)) { b.remove(); return; }
    b.classList.add('ce-block'); b.dataset.field = field;
    applyOffset(b, slide.pos && slide.pos[field]);
  });
}
function tagChrome(el, field) {
  el.classList.add('ce-block'); el.dataset.field = field;
  applyOffset(el, state.layout.pos && state.layout.pos[field]);
}
