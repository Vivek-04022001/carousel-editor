// 3. ---------- state ----------
const PILLAR_CATS = {
  people: ['Dark Psychology','Manipulation','Human Behavior','Reading People','Toxic Patterns','Social Dynamics','Behavior Analysis','Influence','Persuasion','Power Dynamics'],
  self:   ['Emotional Control','Clarity','Self-Awareness','Overthinking','Identity','Patterns','Emotional Intelligence','Inner Peace','Mental Clarity','Self-Mastery'],
  power:  ['Money Mindset','Wealth Psychology','Influence','Financial Intelligence','Real-World Leverage','Status','Discipline','Execution','Building Wealth','Self-Worth'],
};
function defaultState() {
  return {
    v: 2,
    wordmark: 'THE GREY MIND',
    handle: '@_thegreymind_',
    pillar: 'people',
    pillars: { power:{label:'POWER',accent:'#173D2C'}, self:{label:'SELF',accent:'#18293F'}, people:{label:'PEOPLE',accent:'#6B1A1A'} },
    colors: { bodyBg:'#0a0a0a', text:'#F5F5F5', barShow:true, barWidth:8 },
    // each chrome element: own colour + opacity + blend mode (export-safe flat colour computed)
    elements: {
      eyebrow:  { color:'#F5F5F5', opacity:0.55, blend:'overlay' },
      wordmark: { color:'#F5F5F5', opacity:0.42, blend:'normal'  },
      counter:  { color:'#F5F5F5', opacity:0.42, blend:'normal'  },
    },
    type: {
      wordmark:{size:28,weight:400,track:200},
      counter: {size:28,weight:400,track:0},
      eyebrow: {size:32,weight:300,track:250,gap:50},
      title:   {size:95,weight:500,lh:105,track:0},
      heading: {size:52,weight:700,lh:46,track:0,gap:34},
      body:    {size:32,weight:500,lh:46,track:0},
      cta:     {size:50,weight:500,lh:62,track:0},
      quote:   {size:78,weight:500,lh:92,track:0},
      attribution:{size:30,weight:400,track:120,gap:46},
      quotemark:{size:150,weight:500,gap:6},
      compareLabel:{size:26,weight:700,track:140,gap:14},
      compareText: {size:36,weight:400,lh:46,track:0},
      term:    {size:84,weight:700,lh:88,track:0,ruleW:120,gap:30},
      definition:{size:36,weight:400,lh:48,track:0},
      example: {size:28,weight:400,track:0,gap:30},
      interruptKicker:{size:30,weight:700,track:200,gap:30},
      interrupt:{size:104,weight:700,lh:104,track:0},
      recapKicker:{size:30,weight:700,track:200,gap:24},
      recapTitle: {size:48,weight:600,lh:54,track:0,gap:40},
      recapItem:  {size:34,weight:400,lh:42,track:0,gap:22},
    },
    layout: { margin:80, bodyTop:360, coverShift:0, ctaShift:0, quoteShift:0, compareTop:300, termTop:300, interruptShift:0, recapTop:240 },
    ui: { guides:false, canvasEdit:true, tool:'move', zoom:null },
    slides: [
      { type:'cover', eyebrow:'Social Dynamics', title:'**The Psychology Behind** Why You’re Liked More When You Care Less.' },
      { type:'body', heading:'let’s be clear about what ”caring less” actually means.',
        body:'It is not coldness. It is not pretending people don’t matter.\n\nIt means your sense of self isn’t hanging on whether this specific person approves of you right now.\n\nThat’s it. That’s the whole thing.\n\nAnd that distinction changes everything that follows.' },
      { type:'body', heading:'so where does the “care less” effect actually come from?',
        body:'When you need a person to like you, they feel it.\n\nThe slight over-explaining. The quick agreement. The laugh that comes a beat too early.\n\nNone of it is loud. All of it registers.' },
      { type:'term', eyebrow:'Social Dynamics', term:'Outcome dependence',
        definition:'Needing a specific reaction from someone before you can feel okay. It quietly hands them the controls.',
        example:'e.g. re-reading a text to check if they “still” like you.' },
      { type:'compare', heading:'Caring less, in one contrast:',
        labelA:'The trap', textA:'You explain yourself\nuntil they finally approve.', colorA:'#C8553D',
        labelB:'The move', textB:'You say it once —\nand let the silence hold.', colorB:'#3E9E6E' },
      { type:'interrupt', kicker:'Read this twice', line:'You don’t need them to **agree.**\nYou need you to **decide.**' },
      { type:'quote', eyebrow:'Social Dynamics', quote:'Detachment isn’t the absence of care.\nIt’s the **presence of self.**', attribution:'— Lucid' },
      { type:'recap', kicker:'Save this', title:'The whole thing, in four lines:', items:['Caring less = self, not coldness.','Neediness leaks — people feel it.','Outcome dependence hands them control.','Say it once. Let the silence hold.'] },
      { type:'cta', text:'Save this. You’ll need it the next time you catch yourself trying too hard.' },
    ],
    current: 0,
  };
}
let state = defaultState();
// Backfill keys added in later versions onto an older saved/loaded state (e.g. quote typography).
function migrate(s) {
  const d = defaultState();
  const mergeMap = (key) => { s[key] = Object.assign({}, d[key], s[key] || {}); for (const k in d[key]) if (d[key][k] && typeof d[key][k] === 'object') s[key][k] = Object.assign({}, d[key][k], s[key][k] || {}); };
  ['type', 'elements'].forEach(mergeMap);
  s.layout = Object.assign({}, d.layout, s.layout || {});
  s.colors = Object.assign({}, d.colors, s.colors || {});
  s.pillars = Object.assign({}, d.pillars, s.pillars || {});
  if (!s.ui) s.ui = {};
  if (s.ui.canvasEdit === undefined) s.ui.canvasEdit = true;
  if (s.ui.tool === undefined) s.ui.tool = 'move';
  if (s.ui.zoom === undefined) s.ui.zoom = null;   // null = fit-to-screen
  return s;
}
function activeSlide() { return state.slides[state.current]; }
function pillarAccent() { return state.pillars[state.pillar].accent; }
const DARK_TYPES = ['body', 'compare', 'term'];          // charcoal bg + left accent bar
const TOP_TYPES = ['body', 'compare', 'term', 'recap'];  // top-aligned (vs vertically centred)
function slideBg(slide) { return DARK_TYPES.includes(slide.type) ? state.colors.bodyBg : pillarAccent(); }
function track(t) { return (t || 0) / 1000 + 'em'; }
function elColor(role, slide) { const e = state.elements[role]; return blendOver(slideBg(slide), e.color, e.blend, e.opacity); }
