// 9. ---------- history (undo / redo) + autosave ----------
const SKEY = 'tgm_state_v2';
let history = [], hidx = -1, suppress = false, saveTimer = null, histTimer = null;
function snap() { return JSON.stringify(state); }
function pushHistory() {
  const s = snap();
  if (history[hidx] === s) return;
  history = history.slice(0, hidx + 1); history.push(s);
  if (history.length > 80) history.shift();
  hidx = history.length - 1;
  updateHistButtons();
}
function commitSoon() {
  clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(SKEY, snap()); } catch (e) {} }, 350);
  if (!suppress) { clearTimeout(histTimer); histTimer = setTimeout(pushHistory, 450); }
}
function restore(json) {
  suppress = true;
  state = migrate(JSON.parse(json));
  ceField = null; ceEditing = false; ceHideToolbar();
  syncBrand(); rebuildGrids(); renderAll();
  $('guidesChk').checked = !!state.ui.guides;
  $('canvasChk').checked = !!state.ui.canvasEdit;
  suppress = false;
  updateHistButtons();
}
function undo() { if (hidx > 0) { hidx--; restore(history[hidx]); } }
function redo() { if (hidx < history.length - 1) { hidx++; restore(history[hidx]); } }
function updateHistButtons() { $('undoBtn').disabled = hidx <= 0; $('redoBtn').disabled = hidx >= history.length - 1; }
$('undoBtn').onclick = undo; $('redoBtn').onclick = redo;
function syncBrand() { $('wordmark').value = state.wordmark; $('handle').value = state.handle; }
