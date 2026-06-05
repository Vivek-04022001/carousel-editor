// 5. ---------- editor fields + format toolbar ----------
let lastField = null;
function field(label, value, oninput, opts = {}) {
  const ta = h('textarea', { oninput:e => oninput(e.target.value), onfocus:e => { lastField = e.target; } });
  if (opts.placeholder) ta.setAttribute('placeholder', opts.placeholder);
  if (opts.minHeight) ta.style.minHeight = opts.minHeight + 'px';
  ta.value = value || '';
  return h('div', { class:'row' }, h('label', {}, label), h('div', { class:'ctrl' }, ta));
}
function datalistField(label, value, listId, options, oninput) {
  const dl = h('datalist', { id:listId }, ...options.map(o => h('option', { value:o })));
  const inp = h('input', { type:'text', list:listId, value:value || '', oninput:e => oninput(e.target.value), onfocus:e => { lastField = e.target; } });
  return h('div', { class:'row' }, h('label', {}, label), h('div', { class:'ctrl' }, inp, dl));
}
function focusFirstField() { const el = $('editor').querySelector('textarea, input[type=text]'); if (el) { el.focus(); lastField = el; } }
function wrapSelection(prefix, suffix) {
  if (!lastField || !lastField.isConnected) focusFirstField();
  const ta = lastField; if (!ta) return;
  const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? ta.value.length;
  const val = ta.value, sel = val.slice(s, e) || 'text';
  ta.value = val.slice(0, s) + prefix + sel + suffix + val.slice(e);
  ta.dispatchEvent(new Event('input', { bubbles:true }));
  ta.focus();
  ta.selectionStart = s + prefix.length; ta.selectionEnd = s + prefix.length + sel.length;
}
function stripSelection() {
  const ta = lastField; if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd; if (s === e) return;
  const cleaned = ta.value.slice(s, e).replace(/\*\*/g, '').replace(/\[(?:w=\d{3}|c=#?[0-9a-fA-F]{3,8}|sz=\d{1,3}|\/(?:w|c|sz)?)\]/g, '');
  ta.value = ta.value.slice(0, s) + cleaned + ta.value.slice(e);
  ta.dispatchEvent(new Event('input', { bubbles:true }));
  ta.focus();
}
function bindFormatBar() {
  document.querySelectorAll('#fmtbar [data-wrap]').forEach(btn => {
    const [pre, suf] = btn.getAttribute('data-wrap').split('|');
    btn.onmousedown = e => e.preventDefault();
    btn.onclick = () => wrapSelection(pre, suf);
  });
  ['fmtColorBtn','fmtSizeBtn','fmtClear'].forEach(id => { $(id).onmousedown = e => e.preventDefault(); });
  $('fmtColorBtn').onclick = () => wrapSelection(`[c=${$('fmtColor').value}]`, '[/c]');
  $('fmtSizeBtn').onclick  = () => wrapSelection(`[sz=${$('fmtSize').value}]`, '[/sz]');
  $('fmtClear').onclick    = stripSelection;
}

const Panels = {
  cover(s) {
    return [
      datalistField('Eyebrow', s.eyebrow, 'cats-cover', PILLAR_CATS[state.pillar], v => { s.eyebrow = v; renderPreview(); }),
      h('div', { class:'help' }, 'Category label above the title (auto ALL-CAPS). Suggestions match the pillar.'),
      field('Title', s.title, v => { s.title = v; renderPreview(); renderSlideList(); }, { minHeight:90 }),
    ];
  },
  body(s) {
    return [
      field('Heading', s.heading, v => { s.heading = v; renderPreview(); renderSlideList(); }, { minHeight:70 }),
      field('Body', s.body, v => { s.body = v; renderPreview(); }, { minHeight:150 }),
      h('div', { class:'help' }, 'Leave a blank line between paragraphs for the airy spacing.'),
    ];
  },
  cta(s) {
    return [
      datalistField('Eyebrow', s.eyebrow, 'cats-cta', PILLAR_CATS[state.pillar], v => { s.eyebrow = v; renderPreview(); }),
      field('CTA line', s.text, v => { s.text = v; renderPreview(); renderSlideList(); }, { minHeight:90 }),
      h('div', { class:'help' }, 'Closing line on the pillar-colour background. One clear action — never desperate.'),
    ];
  },
  quote(s) {
    return [
      datalistField('Eyebrow', s.eyebrow, 'cats-quote', PILLAR_CATS[state.pillar], v => { s.eyebrow = v; renderPreview(); }),
      field('Quote', s.quote, v => { s.quote = v; renderPreview(); renderSlideList(); }, { minHeight:110 }),
      field('Attribution', s.attribution, v => { s.attribution = v; renderPreview(); }, { minHeight:44 }),
      h('div', { class:'help' }, 'A single statement on the pillar colour — one breath. Attribution optional (e.g. “— Lucid”). The big “ mark is decorative; size it under Typography.'),
    ];
  },
  compare(s) {
    const colorRow = (label, key, def) => {
      const c = h('input', { type:'color', value:s[key] || def });
      c.addEventListener('input', () => { s[key] = c.value; renderPreview(); });
      return h('div', { class:'row' }, h('label', {}, label), h('div', { class:'ctrl' }, c));
    };
    return [
      field('Heading', s.heading, v => { s.heading = v; renderPreview(); renderSlideList(); }, { minHeight:56 }),
      field('Label A', s.labelA, v => { s.labelA = v; renderPreview(); }, { minHeight:38 }),
      field('Text A', s.textA, v => { s.textA = v; renderPreview(); }, { minHeight:64 }),
      colorRow('Colour A', 'colorA', '#C8553D'),
      field('Label B', s.labelB, v => { s.labelB = v; renderPreview(); }, { minHeight:38 }),
      field('Text B', s.textB, v => { s.textB = v; renderPreview(); }, { minHeight:64 }),
      colorRow('Colour B', 'colorB', '#3E9E6E'),
      h('div', { class:'help' }, 'A two-part contrast (the trap vs the move) on charcoal. Red/green by default — recolour each side as you like.'),
    ];
  },
  term(s) {
    return [
      datalistField('Eyebrow', s.eyebrow, 'cats-term', PILLAR_CATS[state.pillar], v => { s.eyebrow = v; renderPreview(); }),
      field('Term', s.term, v => { s.term = v; renderPreview(); renderSlideList(); }, { minHeight:46 }),
      field('Definition', s.definition, v => { s.definition = v; renderPreview(); }, { minHeight:90 }),
      field('Example', s.example, v => { s.example = v; renderPreview(); }, { minHeight:46 }),
      h('div', { class:'help' }, 'Define one concept on charcoal. The accent rule under the term uses the pillar colour. Example (optional) renders in muted italic.'),
    ];
  },
  interrupt(s) {
    return [
      field('Kicker', s.kicker, v => { s.kicker = v; renderPreview(); }, { minHeight:38 }),
      field('Line', s.line, v => { s.line = v; renderPreview(); renderSlideList(); }, { minHeight:90 }),
      h('div', { class:'help' }, 'A jolt mid-carousel — short and imperative, on the pillar colour. Keep it to one breath; let it reset attention.'),
    ];
  },
  recap(s) {
    const autofill = h('button', { class:'ghost mini', onclick:() => {
      s.items = state.slides.filter(x => ['body','term','compare'].includes(x.type))
        .map(x => x.type === 'term' ? x.term : x.type === 'compare' ? (x.heading || x.labelA) : x.heading)
        .filter(Boolean);
      renderEditor(); renderPreview(); renderSlideList();
    } }, 'Auto-fill from slides');
    return [
      field('Kicker', s.kicker, v => { s.kicker = v; renderPreview(); }, { minHeight:38 }),
      field('Title', s.title, v => { s.title = v; renderPreview(); renderSlideList(); }, { minHeight:48 }),
      field('Items (one per line)', (s.items || []).join('\n'), v => { s.items = v.split('\n'); renderPreview(); }, { minHeight:140 }),
      h('div', { class:'row' }, h('label', {}, ''), h('div', { class:'ctrl' }, autofill)),
      h('div', { class:'help' }, 'A “save this” recap on the pillar colour — one takeaway per line (markup works per line). Kicker + title are also editable on the canvas; the list is edited here.'),
    ];
  },
};

// 6. ---------- fine-tune grids (slider + number) ----------
function rangeF(label, obj, key, min, max, step, oninput) {
  const val = h('span', { class:'val' }, obj[key]);
  const r = h('input', { type:'range', min, max, step, value:obj[key] });
  const n = h('input', { type:'number', min, max, step, value:obj[key], class:'numbox' });
  const set = v => { const nv = +v; obj[key] = nv; r.value = nv; n.value = nv; val.textContent = nv; oninput(); };
  r.addEventListener('input', () => set(r.value));
  n.addEventListener('input', () => set(n.value));
  return h('div', { class:'f' }, h('label', {}, label, val), h('div', { class:'rrow' }, r, n));
}
function selF(label, obj, key, options, oninput) {
  const sel = h('select', { onchange:e => { obj[key] = isNaN(+e.target.value) ? e.target.value : +e.target.value; oninput(); } },
    ...options.map(o => h('option', { value:o, selected:String(obj[key]) === String(o) }, o)));
  return h('div', { class:'f' }, h('label', {}, label), sel);
}
function colorF(label, obj, key, oninput) {
  const c = h('input', { type:'color', value:obj[key], style:{ width:'100%', height:'34px' } });
  c.addEventListener('input', () => { obj[key] = c.value; oninput(); });
  return h('div', { class:'f' }, h('label', {}, label), c);
}
const WEIGHTS = [300,400,500,600,700];
function renderTypoGrid() {
  const g = $('typoGrid'); g.innerHTML = ''; const T = state.type; const up = renderPreview;
  const add = (...n) => n.forEach(x => g.appendChild(x));
  add(rangeF('Title size', T.title,'size',40,160,1,up),        selF('Title weight', T.title,'weight',WEIGHTS,up));
  add(rangeF('Title line-height', T.title,'lh',50,180,1,up),   rangeF('Eyebrow→title gap', T.eyebrow,'gap',0,160,2,up));
  add(rangeF('Eyebrow size', T.eyebrow,'size',16,60,1,up),     rangeF('Eyebrow tracking', T.eyebrow,'track',0,500,5,up));
  add(rangeF('Heading size', T.heading,'size',24,100,1,up),    selF('Heading weight', T.heading,'weight',WEIGHTS,up));
  add(rangeF('Heading line-height', T.heading,'lh',24,140,1,up), rangeF('Heading→body gap', T.heading,'gap',0,120,2,up));
  add(rangeF('Body size', T.body,'size',16,72,1,up),           selF('Body weight', T.body,'weight',WEIGHTS,up));
  add(rangeF('Body line-height', T.body,'lh',20,120,1,up),     rangeF('Body tracking', T.body,'track',0,300,5,up));
  add(rangeF('CTA size', T.cta,'size',24,120,1,up),            selF('CTA weight', T.cta,'weight',WEIGHTS,up));
  add(rangeF('CTA line-height', T.cta,'lh',24,160,1,up),       rangeF('Wordmark size', T.wordmark,'size',14,48,1,up));
  add(rangeF('Wordmark tracking', T.wordmark,'track',0,500,5,up), rangeF('Counter size', T.counter,'size',14,48,1,up));
  add(rangeF('Quote size', T.quote,'size',32,140,1,up),         selF('Quote weight', T.quote,'weight',WEIGHTS,up));
  add(rangeF('Quote line-height', T.quote,'lh',36,180,1,up),    rangeF('Quote mark size', T.quotemark,'size',0,260,2,up));
  add(rangeF('Attribution size', T.attribution,'size',16,60,1,up), rangeF('Attribution gap', T.attribution,'gap',0,120,2,up));
  add(rangeF('Compare label size', T.compareLabel,'size',16,44,1,up), selF('Compare label weight', T.compareLabel,'weight',WEIGHTS,up));
  add(rangeF('Compare text size', T.compareText,'size',20,64,1,up),   rangeF('Compare text line-height', T.compareText,'lh',24,90,1,up));
  add(rangeF('Term size', T.term,'size',40,140,1,up),                selF('Term weight', T.term,'weight',WEIGHTS,up));
  add(rangeF('Term rule width', T.term,'ruleW',0,400,5,up),          rangeF('Term→def gap', T.term,'gap',0,120,2,up));
  add(rangeF('Definition size', T.definition,'size',20,64,1,up),     rangeF('Definition line-height', T.definition,'lh',24,90,1,up));
  add(rangeF('Example size', T.example,'size',16,48,1,up),           rangeF('Example gap', T.example,'gap',0,120,2,up));
  add(rangeF('Interrupt size', T.interrupt,'size',48,180,1,up),      selF('Interrupt weight', T.interrupt,'weight',WEIGHTS,up));
  add(rangeF('Interrupt line-height', T.interrupt,'lh',48,200,1,up), rangeF('Interrupt kicker size', T.interruptKicker,'size',16,60,1,up));
  add(rangeF('Recap title size', T.recapTitle,'size',28,90,1,up),    rangeF('Recap title line-height', T.recapTitle,'lh',30,110,1,up));
  add(rangeF('Recap item size', T.recapItem,'size',20,60,1,up),      rangeF('Recap item gap', T.recapItem,'gap',0,80,2,up));
}
function renderElements() {
  const box = $('elemBody'); box.innerHTML = '';
  ['eyebrow','wordmark','counter'].forEach(role => {
    const e = state.elements[role]; const up = renderPreview;
    const grid = h('div', { class:'mini', style:{ marginBottom:'12px' } },
      h('div', { class:'f full', style:{ color:'var(--text)', fontSize:'12px', fontWeight:'600', textTransform:'capitalize' } }, role),
      colorF('Colour', e,'color',up),
      selF('Blend', e,'blend',BLEND_MODES,up),
      rangeF('Opacity', e,'opacity',0,1,0.02,up),
    );
    box.appendChild(grid);
  });
}
function renderColorGrid() {
  const g = $('colorGrid'); g.innerHTML = ''; const C = state.colors; const up = () => { renderPreview(); renderPillars(); };
  const add = (...n) => n.forEach(x => g.appendChild(x));
  add(colorF('POWER', state.pillars.power,'accent',up),  colorF('SELF', state.pillars.self,'accent',up));
  add(colorF('PEOPLE', state.pillars.people,'accent',up), colorF('Body bg', C,'bodyBg',renderPreview));
  add(colorF('Text', C,'text',renderPreview),            rangeF('Left bar width', C,'barWidth',0,40,1,renderPreview));
}
function renderLayoutGrid() {
  const g = $('layoutGrid'); g.innerHTML = ''; const L = state.layout; const up = renderPreview;
  const add = (...n) => n.forEach(x => g.appendChild(x));
  add(rangeF('Margin', L,'margin',20,160,2,up),       rangeF('Body top', L,'bodyTop',100,1000,5,up));
  add(rangeF('Cover Y shift', L,'coverShift',-400,400,5,up), rangeF('CTA Y shift', L,'ctaShift',-400,400,5,up));
}
function rebuildGrids() { renderTypoGrid(); renderElements(); renderColorGrid(); renderLayoutGrid(); }
