// 10. ---------- export & import ----------
async function exportSlide(slide, format, index) {
  // Fresh node per export: html-to-image leaves the previous node in a state that
  // makes repeat calls render blank, so reusing one target breaks "Download all".
  const stage = $('render-stage');
  const target = h('div', { class:'slide', style:{ transform:'none' } });
  stage.appendChild(target);
  const idx = (index != null) ? index : state.slides.indexOf(slide);
  renderSlideInto(target, slide, { index:idx, total:state.slides.length });   // no guides on export target
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 60));
  const opts = { width:1080, height:1350, pixelRatio:1, backgroundColor:slideBg(slide) };
  try {
    return (format === 'jpg')
      ? await htmlToImage.toJpeg(target, { ...opts, quality:0.95 })
      : await htmlToImage.toPng(target, opts);
  } finally { stage.removeChild(target); }
}
function dataUrlToBlob(u) { const [head,b64] = u.split(','); const mime = head.match(/data:(.*?);base64/)[1]; const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return new Blob([arr],{type:mime}); }
$('dlOne').onclick = async () => { if (!state.slides.length) return; const fmt = $('format').value; const url = await exportSlide(activeSlide(), fmt, state.current); saveAs(dataUrlToBlob(url), `${state.pillar}_slide_${String(state.current+1).padStart(2,'0')}.${fmt}`); };
$('dlAll').onclick = async () => {
  if (!state.slides.length) return;
  const fmt = $('format').value, zip = new JSZip(), btn = $('dlAll'); btn.disabled = true;
  try {
    for (let i=0;i<state.slides.length;i++) { btn.textContent = `Rendering ${i+1}/${state.slides.length}...`; const url = await exportSlide(state.slides[i], fmt, i); zip.file(`slide_${String(i+1).padStart(2,'0')}.${fmt}`, url.split(',')[1], { base64:true }); }
    saveAs(await zip.generateAsync({ type:'blob' }), `thegreymind_${state.pillar}.zip`);
  } finally { btn.disabled = false; btn.textContent = 'Download all (ZIP)'; }
};
$('exportJson').onclick = () => saveAs(new Blob([JSON.stringify(state, null, 2)], { type:'application/json' }), `thegreymind_${state.pillar}.json`);
$('importJson').onclick = () => $('fileInput').click();
$('fileInput').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { restore(await f.text()); pushHistory(); } catch (err) { alert('Invalid JSON: ' + err.message); } };
$('resetState').onclick = () => { if (confirm('Reset to the sample carousel? (current work is lost)')) { restore(JSON.stringify(defaultState())); pushHistory(); } };
$('clearSaved').onclick = () => { try { localStorage.removeItem(SKEY); } catch (e) {} alert('Autosave cleared. Refresh for a fresh start.'); };

document.addEventListener('keydown', e => {
  const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); return; }
  if (ceEditing) return;                                  // editing handles its own keys (stopPropagation)
  if (ceField && e.key === 'Escape') { e.preventDefault(); ceDeselect(); return; }
  if (ceField && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); ceNudge(e.key, e.shiftKey ? 10 : 2); return; }
  if (typing) return;
  if (e.key === 'ArrowLeft') $('prevSlide').click();
  if (e.key === 'ArrowRight') $('nextSlide').click();
});
