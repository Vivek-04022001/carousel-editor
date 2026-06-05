// 11. ---------- init ----------
(function init() {
  try { const saved = localStorage.getItem(SKEY); if (saved) { const p = JSON.parse(saved); if (p && p.v === 2) state = p; } } catch (e) {}
  migrate(state);
  bindFormatBar();
  syncBrand();
  $('guidesChk').checked = !!state.ui.guides;
  $('canvasChk').checked = !!state.ui.canvasEdit;
  rebuildGrids();
  if (typeof setTool === 'function') setTool(state.ui.tool || 'move');
  renderAll();
  history = [snap()]; hidx = 0; updateHistButtons();
  window.TGM = { state:() => state, renderSlideInto, parseMarkup, slideBg, blendOver, exportSlide, serializeBlock };
})();
