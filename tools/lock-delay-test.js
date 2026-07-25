#!/usr/bin/env node
// Měření zámku po dosednutí (Dr. Wedding).
//
// Proč existuje: ai-sim.js pokládá kapsle rovnou na cíl a ai-pace-test.js si pád simuluje
// vlastní smyčkou — ani jeden tedy nesáhne na updatePlayer(), kde žije „lock delay". Tenhle
// test žene SKUTEČNOU snímkovou smyčku (updatePlayer) v sólo AI partii a měří to, co hráč
// reálně cítí: kolik snímků kapsle VISÍ dosednutá u dna, než zapadne (a kolik snímků celkem
// od vysazení po zámek). Tak jde ověřit, že se doba „dopadlo, ale nezapadlo" opravdu zkrátila.
//
// „VISÍ" = snímky, kdy kapsle už na ničem nedosedla a čeká na zámek. Přesně tahle prodleva
// nutila lidi ovládat omylem „další" kapsli.
//
// Použití:
//   node tools/lock-delay-test.js                 # aktuální index.html, start (95) i max (22)
//   node tools/lock-delay-test.js /tmp/old.html   # porovnej se starší verzí
//   SPEED=22 node tools/lock-delay-test.js        # jen jedna rychlost
//   PILLS=1000 node tools/lock-delay-test.js      # víc kapslí = míň šumu

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
  const PILLS   = process.env.PILLS ? parseInt(process.env.PILLS) : 600;   // kolik kapslí naměřit na konfiguraci
  const SPEEDS  = process.env.SPEED ? [parseInt(process.env.SPEED)] : [95, 22];   // 95 = start hry, 22 = DROP_MIN
  const VIRUSES = 16;

  mode = 'play';
  dropIntervalNow = () => SPEED;   // function declaration -> jde přepsat; drž rychlost pevně
  let SPEED = 95;

  // NOSOFT verze aiThink: nechá AI hrát chytře, ale nezapne soft drop (padDrop=false).
  // Tím měříme „pasivního hráče", co drží kapsli až do zámku bez držení dolů = nejdelší visení.
  const origThink = aiThink;
  let noSoft = false;
  aiThink = function(p){ origThink(p); if(noSoft) p.padDrop = false; };

  function freshBoard(){
    const p = newPlayer('R');
    p.ai = true;
    p.pillIdx = 0; p.next = pillAt(0);   // naplň „další" kapsli (jinak to dělá startGame)
    spawnViruses(p.grid, VIRUSES, 5);
    const sink = newPlayer('L');         // pasivní soupeř: jen pohltí případné smetí (other(p))
    players = [p, sink];
    winPending = false; firstDone = null; firstOutcome = null;
    return p;
  }

  function run(soft){
    noSoft = !soft;
    let p = freshBoard();
    let hangSum = 0, hangN = 0, waitSum = 0, waitN = 0;
    let hang = 0, wait = 0, prevPill = false, guard = 0;

    const origLock = lock;
    lock = function(pp){ hangSum += hang; hangN++; waitSum += wait; waitN++; hang = 0; wait = 0; origLock(pp); };

    while(hangN < PILLS && guard < 40e6){
      guard++;
      if(winPending){ p = freshBoard(); prevPill = false; hang = 0; wait = 0; }   // konec partie -> nová deska, měř dál
      const hasPill = !!p.pill;
      if(hasPill && !prevPill){ hang = 0; wait = 0; }        // vysazena nova kapsle
      prevPill = hasPill;
      if(hasPill){
        wait++;
        if(!canPlace(p.grid, {...p.pill, r:p.pill.r+1})) hang++;   // dosedla a ceka na zamek
      }
      updatePlayer(p);
    }
    lock = origLock;
    return { hang: hangSum/hangN, wait: waitSum/waitN, n: hangN };
  }

  console.log('');
  console.log('  ' + '${GAME_FILE.replace(ROOT + '/', '')}' + '  (' + PILLS + ' kapsli / konfigurace)');
  console.log('  rychlost | soft drop |  visi u dna  | celkem na kapsli');
  console.log('  ---------+-----------+--------------+-----------------');
  for(const s of SPEEDS){
    SPEED = s;
    for(const soft of [false, true]){
      const r = run(soft);
      const lab = (s + ' sn/r').padEnd(8);
      const sd  = (soft ? 'ano (drzi dolu)' : 'ne (pasivni)   ').padEnd(9);
      console.log('  ' + lab + ' | ' + sd.slice(0,9) + ' | ' + (r.hang.toFixed(1) + ' sn').padStart(8) + '     | ' + (r.wait.toFixed(1) + ' sn').padStart(9));
    }
  }
  console.log('');
  console.log('  (60 sn/s: 16 sn = 0.27 s, 3 sn = 0.05 s, 95 sn = 1.58 s)');
  console.log('');
})();
`;

new Function(audio + '\n' + m[1] + '\n' + TEST)();
