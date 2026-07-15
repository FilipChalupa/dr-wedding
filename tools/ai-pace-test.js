#!/usr/bin/env node
// Test tempa AI: dojede kapsle tam, kam ji AI naplánovala, než dopadne?
//
// Proč existuje: ai-sim.js pokládá kapsle rovnou na cíl, takže vůbec neřeší, jestli je
// tam AI stihne dovézt. Tenhle test simuluje smyčku snímek po snímku (aiThink + pád),
// takže odhalí, když AI manévruje moc pomalu a kapsle jí dopadne po cestě — přesně tak
// chytil regresi, kdy se při nejvyšší rychlosti minula cíle 3 % kapslí.
//
// „MINULO CIL" má zůstat kolem 0.2 %. Když povyskočí, je AI moc pomalá na danou
// rychlost pádu — viz AI_PACE_USE / AI_PACE_MAX / AI_PACE_MAX_HARD v index.html.
//
// Použití:
//   node tools/ai-pace-test.js                  # start hry (95 snímků na řádek)
//   SPEED=22 node tools/ai-pace-test.js         # nejvyšší rychlost (DROP_MIN)
//   SPEED=22 LEVEL=6 node tools/ai-pace-test.js # hardcore má vlastní strop
//   node tools/ai-pace-test.js /tmp/old.html    # porovnej se starší verzí

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GAME_FILE = process.argv[2] || path.join(ROOT, 'index.html');

const noop = () => {};
const ctx = new Proxy({}, { get: (t, k) => (k === 'canvas' ? { width: 720, height: 576 } : noop), set: () => true });
const cls = new Proxy({}, { get: (t, k) => (k === 'contains' ? () => false : noop) });
const el = () => ({ width: 720, height: 576, getContext: () => ctx, classList: cls,
  style: { setProperty: noop }, addEventListener: noop,
  getBoundingClientRect: () => ({ top: 0, bottom: 576, left: 0, right: 720 }),
  querySelector: () => el(), appendChild: noop, innerHTML: '', scrollTop: 0 });
globalThis.document = { getElementById: el, querySelector: el, querySelectorAll: () => [], body: el(), documentElement: el(), addEventListener: noop, createElement: el, hidden: false };
globalThis.window = { addEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), location: { search: '' } };
globalThis.location = { search: '', href: '' };
globalThis.navigator = { getGamepads: () => [], userAgent: 'node' };
globalThis.requestAnimationFrame = noop;
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
globalThis.AudioContext = function () { return new Proxy({}, { get: () => () => ({ connect: noop, start: noop, stop: noop, gain: { value: 0, setValueAtTime: noop }, frequency: { value: 0 } }) }); };
globalThis.webkitAudioContext = globalThis.AudioContext;
globalThis.StatsView = { mount: () => ({ next: noop, prev: noop }), loadGames: () => [] };

const audio = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
const html = fs.readFileSync(GAME_FILE, 'utf8');
const m = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html);
if (!m) { console.error('V ' + GAME_FILE + ' nenalezen vnořený <script>.'); process.exit(1); }

const TEST = `
;(function(){
  const SPEED = process.env.SPEED ? parseInt(process.env.SPEED) : 95;   // snímků na řádek
  dropIntervalNow = () => SPEED;      // function declaration -> jde přepsat
  level = process.env.LEVEL ? parseInt(process.env.LEVEL) : 3;

  let total=0, missed=0, frames=0;
  for(let gi=0; gi<60; gi++){
    const g = new Array(COLS*ROWS).fill(null);
    spawnViruses(g, 16, 5);
    pillSeq = [];
    const p = {grid:g, ai:true, pill:null, next:null, pillIdx:0,
               aiPlan:null, aiTimer:0, padDrop:false, spawnGrace:0, dropTimer:0,
               flashes:[], pendingGarbage:[], landFx:null, side:'R', score:0, gainCells:0, gainVir:0};
    for(let i=0; i<250; i++){
      const a = pillAt(i), b = pillAt(i+1);
      p.pill = {r:0, c:3, orient:0, ca:a.ca, cb:a.cb};
      p.aiPlan = null; p.aiTimer = 0; p.padDrop = false;
      p.dropTimer = 0; p.spawnGrace = SPAWN_GRACE;
      if(!canPlace(p.grid, p.pill)) break;

      // zachyť lock(), ať jde porovnat, kde kapsle skončila, s tím, kam mířila
      let locked=false, f=0, plan=null;
      const origLock = lock;
      lock = function(){ locked = true; };
      while(!locked && f < 4000){
        aiThink(p);
        if(!plan) plan = {...p.aiPlan};
        if(p.spawnGrace>0) p.spawnGrace--;
        const soft = p.spawnGrace<=0 && p.padDrop;
        p.dropTimer += soft ? 7 : 1;
        if(p.dropTimer >= dropIntervalNow()){
          p.dropTimer = 0;
          const np = {...p.pill, r:p.pill.r+1};
          if(canPlace(p.grid, np)) p.pill = np; else locked = true;
        }
        f++;
      }
      lock = origLock;
      total++; frames += f;
      if(p.pill.c !== plan.col || p.pill.orient !== plan.orient) missed++;
      origLock(p);                      // teď polož doopravdy, ať hra pokračuje
      resolveFull(p.grid);
      if(countViruses(p.grid)===0) break;
    }
  }
  console.log('');
  console.log('  rychlost padu: ' + SPEED + ' snimku/radek | uroven ' + level);
  console.log('    kapsli:           ' + total);
  console.log('    MINULO CIL:       ' + missed + ' (' + (100*missed/total).toFixed(2) + '%)   <- ma zustat ~0.2 %');
  console.log('    snimku na kapsli: ' + (frames/total).toFixed(1) + '   (jak dlouho divak ceka)');
  console.log('');
})();
`;

new Function(audio + '\n' + m[1] + '\n' + TEST)();
