/* =========================================================================
 * The Grey Mind — carousel editor. Single file, no build step.
 *   1. helpers / colour + blend maths
 *   2. markup  (**bold** / [w] [c] [sz])
 *   3. state (+ autosave restore)
 *   4. renderers (wordmark / counter / leftbar + per-type content)
 *   5. editor fields + format toolbar
 *   6. fine-tune grids (sliders) — typography / elements / colours / layout
 *   7. views (list / editor / preview + guides)
 *   8. controls / slide actions
 *   9. history (undo-redo) + autosave
 *  10. export & import
 *  11. init
 * ========================================================================= */

// 1. ---------- helpers ----------
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  props = props || {};
  for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const $ = (id) => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function hexToRgb(hex) { const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || ''); if (!m) return [245,245,245]; const n = parseInt(m[1],16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgbToHex(r,g,b) { return '#' + [r,g,b].map(x => clamp(Math.round(x),0,255).toString(16).padStart(2,'0')).join(''); }
// per-channel blend, inputs 0..1 (b=base/backdrop, s=source/top)
function blendCh(b, s, mode) {
  switch (mode) {
    case 'multiply':    return b*s;
    case 'screen':      return 1-(1-b)*(1-s);
    case 'overlay':     return b<0.5 ? 2*b*s : 1-2*(1-b)*(1-s);
    case 'hard-light':  return s<0.5 ? 2*b*s : 1-2*(1-b)*(1-s);
    case 'soft-light':  return s<0.5 ? b-(1-2*s)*b*(1-b)
                                     : b+(2*s-1)*((b<0.25 ? ((16*b-12)*b+4)*b : Math.sqrt(b))-b);
    case 'color-dodge': return s>=1 ? 1 : clamp(b/(1-s),0,1);
    case 'lighten':     return Math.max(b,s);
    case 'darken':      return Math.min(b,s);
    default:            return s; // normal
  }
}
// flat resulting colour of a `top` colour drawn over solid `bg` with blend `mode` + `opacity`.
// Export-safe (no mix-blend-mode, which html-to-image drops).
function blendOver(bgHex, topHex, mode, opacity) {
  const B = hexToRgb(bgHex).map(x => x/255), S = hexToRgb(topHex).map(x => x/255);
  const out = [0,1,2].map(i => { const blended = blendCh(B[i], S[i], mode); return (B[i] + (blended - B[i]) * opacity) * 255; });
  return rgbToHex(out[0], out[1], out[2]);
}
const BLEND_MODES = ['normal','overlay','soft-light','multiply','screen','hard-light','color-dodge','lighten','darken'];

// 2. ---------- markup ----------
function parseMarkup(raw) {
  let s = escapeHtml(raw == null ? '' : raw);
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<span style="font-weight:700">$1</span>');
  s = s.replace(/\[w=(\d{3})\]/g, (m,w) => `<span style="font-weight:${w}">`);
  s = s.replace(/\[c=#?([0-9a-fA-F]{3,8})\]/g, (m,c) => `<span style="color:#${c}">`);
  s = s.replace(/\[sz=(\d{1,3})\]/g, (m,z) => `<span style="font-size:${z}px">`);
  s = s.replace(/\[\/(?:w|c|sz)?\]/g, '</span>');
  return s;
}
function rich(tag, cls, text, style) { const n = h(tag, { class: cls, style }); n.innerHTML = parseMarkup(text); return n; }
