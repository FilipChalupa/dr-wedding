// Sdílené testovací prostředí pro node harnessy (ai-sim, ai-pace-test, lock-delay-test,
// render-smoke). Podstrčí DOM/Canvas/WebAudio, ať herní kód z index.html projde v Node
// bez prohlížeře, a dá jednotný způsob, jak ho načíst a spustit s testovacím kódem.
//
// Použití:
//   const { ROOT, runGame } = require('./harness-env');
//   runGame(GAME_FILE, `;(function(){ ...test... })();`);
//
// Canvas kontext je „chytrý": kreslicí metody nic nedělají, ale ty, jejichž NÁVRATOVÁ
// hodnota se používá (measureText, createLinearGradient…), vrací použitelný objekt.
// Neznámé metody se tváří jako no-op, takže test nespadne na chybějícím stubu.

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const noop = () => {};

const ctxTarget = {
  font:'10px monospace', fillStyle:'', strokeStyle:'', lineWidth:1, lineCap:'', lineJoin:'',
  textAlign:'', textBaseline:'', globalAlpha:1, globalCompositeOperation:'', shadowBlur:0, shadowColor:'',
  measureText(s){ return { width: (''+s).length * ((parseInt(String(this.font).match(/(\d+)px/)?.[1])||10)) * 0.6 }; },
  createLinearGradient(){ return { addColorStop: noop }; },
  createRadialGradient(){ return { addColorStop: noop }; },
  createPattern(){ return {}; },
  getImageData(){ return { data: [] }; },
  get canvas(){ return { width:720, height:576 }; },
};
const ctx = new Proxy(ctxTarget, {
  get(t, k){ return (k in t) ? t[k] : noop; },   // známé metody/vlastnosti napřímo, jinak no-op
  set(t, k, v){ t[k] = v; return true; },
});

const cls = { add:noop, remove:noop, toggle:noop, contains:()=>false };
const el = () => ({
  width:720, height:576, getContext:()=>ctx, classList:cls,
  style:{ setProperty:noop }, addEventListener:noop,
  getBoundingClientRect:()=>({ top:0, bottom:576, left:0, right:720 }),
  querySelector:()=>el(), appendChild:noop, innerHTML:'', scrollTop:0,
});

function installGlobals(){
  globalThis.document = { getElementById:el, querySelector:el, querySelectorAll:()=>[], body:el(), documentElement:el(), addEventListener:noop, createElement:el, hidden:false };
  globalThis.window = { addEventListener:noop, matchMedia:()=>({ matches:false, addEventListener:noop }), location:{ search:'' } };
  globalThis.location = { search:'', href:'' };
  globalThis.navigator = { getGamepads:()=>[], userAgent:'node' };
  globalThis.requestAnimationFrame = noop;   // NESPOUŠTĚT herní smyčku
  globalThis.localStorage = { getItem:()=>null, setItem:noop, removeItem:noop };
  globalThis.AudioContext = function(){
    return {
      createOscillator:()=>({ type:'', frequency:{ setValueAtTime:noop, exponentialRampToValueAtTime:noop }, connect:()=>({ connect:noop }), start:noop, stop:noop }),
      createGain:()=>({ gain:{ setValueAtTime:noop, linearRampToValueAtTime:noop, exponentialRampToValueAtTime:noop, cancelScheduledValues:noop, value:0 }, connect:()=>({ connect:noop }) }),
      currentTime:0, state:'running', resume:noop, destination:{},
    };
  };
  globalThis.webkitAudioContext = globalThis.AudioContext;
  globalThis.StatsView = { mount:()=>({ next:noop, prev:noop }), loadGames:()=>[] };
}
installGlobals();

// vytáhne sdílený audio.js a vnořený <script> z HTML (výchozí index.html)
function readGame(gameFile){
  const file = gameFile || path.join(ROOT, 'index.html');
  const audio = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
  const html = fs.readFileSync(file, 'utf8');
  const m = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if(!m){ throw new Error('V ' + file + ' nenalezen vnořený <script>.'); }
  return { audio, game: m[1] };
}

// spustí herní kód + testovací úryvek ve sdílené globální scope
function runGame(gameFile, testSrc){
  const { audio, game } = readGame(gameFile);
  new Function(audio + '\n' + game + '\n' + testSrc)();
}

module.exports = { ROOT, ctx, el, installGlobals, readGame, runGame };
