// 8. ---------- controls / slide actions ----------
$('wordmark').oninput = e => { state.wordmark = e.target.value; renderPreview(); };
$('handle').oninput = e => { state.handle = e.target.value; commitSoon(); };
$('guidesChk').onchange = e => { state.ui.guides = e.target.checked; renderPreview(); };
$('addCover').onclick = () => { state.slides.push({ type:'cover', eyebrow:PILLAR_CATS[state.pillar][0], title:'New **title** here.' }); state.current = state.slides.length-1; renderAll(); };
$('addBody').onclick = () => { state.slides.push({ type:'body', heading:'New heading.', body:'Body text...' }); state.current = state.slides.length-1; renderAll(); };
$('addQuote').onclick = () => { state.slides.push({ type:'quote', eyebrow:PILLAR_CATS[state.pillar][0], quote:'A line worth **sitting with.**', attribution:'— Lucid' }); state.current = state.slides.length-1; renderAll(); };
$('addCompare').onclick = () => { state.slides.push({ type:'compare', heading:'The contrast:', labelA:'The trap', textA:'What most people do.', colorA:'#C8553D', labelB:'The move', textB:'What you do instead.', colorB:'#3E9E6E' }); state.current = state.slides.length-1; renderAll(); };
$('addTerm').onclick = () => { state.slides.push({ type:'term', eyebrow:PILLAR_CATS[state.pillar][0], term:'New term', definition:'A one- or two-line definition that earns the swipe.', example:'' }); state.current = state.slides.length-1; renderAll(); };
$('addInterrupt').onclick = () => { state.slides.push({ type:'interrupt', kicker:'Read this twice', line:'One line that **stops** the scroll.' }); state.current = state.slides.length-1; renderAll(); };
$('addRecap').onclick = () => { state.slides.push({ type:'recap', kicker:'Save this', title:'The recap:', items:['First takeaway.','Second takeaway.','Third takeaway.'] }); state.current = state.slides.length-1; renderAll(); };
$('addCta').onclick = () => { state.slides.push({ type:'cta', text:'Save this. You’ll want it later.' }); state.current = state.slides.length-1; renderAll(); };
$('dupSlide').onclick = () => { if (!state.slides.length) return; state.slides.splice(state.current+1, 0, JSON.parse(JSON.stringify(activeSlide()))); state.current++; renderAll(); };
$('delSlide').onclick = () => { if (!state.slides.length) return; state.slides.splice(state.current, 1); state.current = Math.max(0, state.current-1); renderAll(); };
$('prevSlide').onclick = () => { state.current = Math.max(0, state.current-1); renderAll(); };
$('nextSlide').onclick = () => { state.current = Math.min(state.slides.length-1, state.current+1); renderAll(); };
