#!/usr/bin/env node
// Měřicí harness pro AI (Dr. Wedding).
//
// Proč existuje: chování AI se nedá poznat od stolu ani z jednoho pozorování ve hře.
// Tenhle skript načte index.html do Node s podstrčeným DOM, odsimuluje N celých partií
// AI proti desce a vypíše tvrdá čísla — jak kapsle POKLÁDÁ, jak MAŽE viry, jak je silná
// a jak si zasypává starosti. Ladicí konstanty (AI_HORIZ_W, AI_ADJ_W, AI_VERT_MIX_PEN)
// jdou přebít přes proměnné prostředí, takže jde projet celý rozsah bez editace kódu.
//
// Použití:
//   node tools/ai-sim.js                      # výchozí nastavení z index.html, 80 partií
//   GAMES=200 node tools/ai-sim.js            # víc partií = míň šumu (ale pomalejší)
//   ADJ=50 node tools/ai-sim.js               # přebij AI_ADJ_W
//   VPEN=0 HW=1 node tools/ai-sim.js          # chování před laděním AI
//   node tools/ai-sim.js cesta/k/index.html   # porovnej jinou verzi (třeba git show)
//
// Porovnání dvou verzí:
//   git show HEAD~3:index.html > /tmp/old.html
//   node tools/ai-sim.js /tmp/old.html ; node tools/ai-sim.js
//
// Pozn.: čísla mají šum. Rozdíl pod ~0.3 zbylého viru při 80 partiích neznamená nic —
// na závěry o síle chce aspoň GAMES=150.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME_FILE = process.argv[2] || path.join(ROOT, 'index.html');
const GAMES = process.env.GAMES ? parseInt(process.env.GAMES) : 80;
const VIRUSES = process.env.VIRUSES ? parseInt(process.env.VIRUSES) : 16;

// ---- podstrčené DOM, ať herní kód projde v Node bez prohlížeče ----
const noop = () => {};
const ctx = new Proxy({}, { get: (t, k) => (k === 'canvas' ? { width: 720, height: 576 } : noop), set: () => true });
const cls = new Proxy({}, { get: (t, k) => (k === 'contains' ? () => false : noop) });
const el = () => ({
  width: 720, height: 576, getContext: () => ctx, classList: cls,
  style: { setProperty: noop }, addEventListener: noop,
  getBoundingClientRect: () => ({ top: 0, bottom: 576, left: 0, right: 720 }),
  querySelector: () => el(), appendChild: noop, innerHTML: '', scrollTop: 0,
});
globalThis.document = { getElementById: el, querySelector: el, querySelectorAll: () => [], body: el(), documentElement: el(), addEventListener: noop, createElement: el, hidden: false };
globalThis.window = { addEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), location: { search: '' } };
globalThis.location = { search: '', href: '' };
globalThis.navigator = { getGamepads: () => [], userAgent: 'node' };
globalThis.requestAnimationFrame = noop;   // NESPOUŠTĚT herní smyčku
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
globalThis.AudioContext = function () { return new Proxy({}, { get: () => () => ({ connect: noop, start: noop, stop: noop, gain: { value: 0, setValueAtTime: noop }, frequency: { value: 0 } }) }); };
globalThis.webkitAudioContext = globalThis.AudioContext;
globalThis.StatsView = { mount: () => ({ next: noop, prev: noop }), loadGames: () => [] };

const audio = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
const html = fs.readFileSync(GAME_FILE, 'utf8');
const m = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html);
if (!m) { console.error('V ' + GAME_FILE + ' nenalezen vnořený <script>.'); process.exit(1); }
const game = m[1];

const TEST = `
;(function(){
  // ladicí konstanty jde přebít z prostředí (bez editace index.html)
  if(typeof AI_VERT_MIX_PEN !== 'undefined' && process.env.VPEN) AI_VERT_MIX_PEN = parseFloat(process.env.VPEN);
  if(typeof AI_HORIZ_W     !== 'undefined' && process.env.HW)   AI_HORIZ_W     = parseFloat(process.env.HW);
  if(typeof AI_ADJ_W       !== 'undefined' && process.env.ADJ)  AI_ADJ_W       = parseFloat(process.env.ADJ);

  const GAMES = ${GAMES}, VIRUSES = ${VIRUSES};
  const put = {mixH:0, mixV:0, sameH:0, sameV:0};
  let virH=0, virV=0, counting=false;

  // findClears je function declaration -> jde přepsat. Klasifikujeme, jestli mazané
  // čtveřice leží vodorovně nebo svisle. counting=false při hypotetických deskách,
  // které si AI zkouší v aiPlacements — jinak by čísla byla o řád vyšší.
  const orig = findClears;
  findClears = function(g){
    if(!counting) return orig(g);
    for(let r=0;r<ROWS;r++){ let run=1;
      for(let c=1;c<=COLS;c++){ const a=c<COLS?g[I(r,c)]:null, b=g[I(r,c-1)];
        if(a&&b&&a.color===b.color) run++;
        else { if(run>=4) for(let k=c-run;k<c;k++) if(g[I(r,k)].kind==='virus') virH++; run=1; } } }
    for(let c=0;c<COLS;c++){ let run=1;
      for(let r=1;r<=ROWS;r++){ const a=r<ROWS?g[I(r,c)]:null, b=g[I(r-1,c)];
        if(a&&b&&a.color===b.color) run++;
        else { if(run>=4) for(let k=r-run;k<r;k++) if(g[I(k,c)].kind==='virus') virV++; run=1; } } }
    return orig(g);
  };

  let wins=0, burySum=0, buryN=0, sameCol=0, pairV=0; const left=[];
  for(let gi=0; gi<GAMES; gi++){
    const g = new Array(COLS*ROWS).fill(null);
    spawnViruses(g, VIRUSES, 5);
    pillSeq = [];
    const p = {grid:g, ai:true, pill:null, next:null, pillIdx:0};
    for(let i=0; i<400; i++){
      const a = pillAt(i), b = pillAt(i+1);
      p.pill = {r:0, c:3, orient:0, ca:a.ca, cb:a.cb};
      p.next = {ca:b.ca, cb:b.cb};
      const plan = computeAiPlan(p);
      let pill = {r:0, c:plan.col, orient:plan.orient, ca:a.ca, cb:a.cb};
      if(!canPlace(p.grid, pill)) break;                    // deska plná -> smrt
      while(canPlace(p.grid, {...pill, r:pill.r+1})) pill = {...pill, r:pill.r+1};
      if(cellsOf(pill).some(cl => cl.r < 0)) break;
      const vert = (plan.orient===1||plan.orient===3), mixed = (a.ca!==a.cb);
      if(mixed) { if(vert) put.mixV++; else put.mixH++; } else { if(vert) put.sameV++; else put.sameH++; }
      placeInto(p.grid, pill);
      counting = true; resolveFull(p.grid); counting = false;
      if(countViruses(p.grid)===0){ wins++; break; }
    }
    left.push(countViruses(p.grid));
    for(let c=0;c<COLS;c++){ let above=0;
      for(let r=0;r<ROWS;r++){ const cell=p.grid[I(r,c)];
        if(!cell) continue;
        if(cell.kind==='virus'){ burySum+=above; buryN++; } else above++; } }
    for(let c=0;c<COLS;c++) for(let r=0;r<ROWS-1;r++){
      const a=p.grid[I(r,c)], b=p.grid[I(r+1,c)];
      if(a&&b){ pairV++; if(a.color===b.color) sameCol++; } }
  }

  const mixT = put.mixH+put.mixV, sameT = put.sameH+put.sameV, vt = virH+virV;
  const pct = (a,b) => b ? (100*a/b).toFixed(1)+'%' : '-';
  const avg = left.reduce((a,b)=>a+b,0)/left.length;
  console.log('');
  console.log('  nastaveni: AI_HORIZ_W=' + AI_HORIZ_W + ' AI_ADJ_W=' + AI_ADJ_W + ' AI_VERT_MIX_PEN=' + AI_VERT_MIX_PEN);
  console.log('  ' + GAMES + ' partii po ' + VIRUSES + ' starostech');
  console.log('');
  console.log('  POKLADANI');
  console.log('    dvoubarevne kapsle:  nalezato ' + pct(put.mixH,mixT)  + ' | nastojato ' + pct(put.mixV,mixT)  + '  (n=' + mixT + ')');
  console.log('    jednobarevne kapsle: nalezato ' + pct(put.sameH,sameT) + ' | nastojato ' + pct(put.sameV,sameT) + '  (n=' + sameT + ')');
  console.log('  MAZANI');
  console.log('    viry znicene vodorovne ' + pct(virH,vt) + ' | svisle ' + pct(virV,vt));
  console.log('  DESKA');
  console.log('    skladani barev: ' + pct(sameCol,pairV) + ' svislych dvojic ma stejnou barvu');
  console.log('    zasypani:       ' + (burySum/buryN).toFixed(2) + ' bunek nad kazdym zbylym virem');
  console.log('  SILA');
  console.log('    zbylo viru: ' + avg.toFixed(2) + '/' + VIRUSES + ' prumerne | vyher ' + wins + '/' + GAMES);
  console.log('');
})();
`;

new Function(audio + '\n' + game + '\n' + TEST)();
