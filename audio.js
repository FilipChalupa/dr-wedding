// ================= SDÍLENÝ ZVUKOVÝ MODUL (WebAudio, bez build stepu) =================
// Načítá ho index.html i tajná testovací stránka sounds.html přes <script src="audio.js">.
// Klasické skripty sdílí globální scope, takže Snd / audioInit / musicStart jsou dostupné
// oběma stránkám. Hudba na pozadí je obecná; KDY smí hrát a JAK rychle si volající nastaví
// přes háčky musicShouldPlay / musicRateFn (výchozí = hraj pořád, tempo 1×).

let actx = null;
let muted = false;
let activeVoices = [];   // aktuálně znějící/naplánované tóny — aby šly naráz zastavit (výherní znělka apod.)
try{ muted = localStorage.getItem('drwedding-muted')==='1'; }catch(e){}

function audioInit(){
  // AudioContext lze vytvořit/rozběhnout až po gestu uživatele (klávesa/tlačítko)
  try{
    if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    if(actx && actx.state==='suspended') actx.resume();
  }catch(e){}
}
function toggleMute(){
  muted=!muted;
  try{ localStorage.setItem('drwedding-muted', muted?'1':'0'); }catch(e){}
  if(muted){ musicStop(); }
  else { audioInit(); tone(660,0.08,{vol:0.12}); musicStart(); }   // cvaknutí + případně obnov hudbu
}
// jeden tón s obálkou na zadaný absolutní čas; volitelný skluz frekvence (slideTo)
function toneAt(freq, t0, dur, {type='square', vol=0.14, attack=0.005, slideTo=null}={}){
  if(muted || !actx) return;
  const o=actx.createOscillator(), g=actx.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t0);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1,slideTo), t0+dur);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(vol, t0+attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(g).connect(actx.destination);
  o.start(t0); o.stop(t0+dur+0.03);
  const v={o,g}; activeVoices.push(v);
  o.onended=()=>{ const i=activeVoices.indexOf(v); if(i>=0) activeVoices.splice(i,1); };
}
// okamžitě (s krátkým doztlumením proti lupnutí) zastav všechny znějící tóny
function stopAllSound(){
  if(!actx) return;
  const now=actx.currentTime;
  for(const v of activeVoices){
    try{
      v.g.gain.cancelScheduledValues(now);
      v.g.gain.setValueAtTime(Math.max(0.0001, v.g.gain.value), now);
      v.g.gain.linearRampToValueAtTime(0.0001, now+0.04);
      v.o.stop(now+0.06);
    }catch(e){}
  }
  activeVoices=[];
}
function tone(freq, dur, opts={}){ if(!actx) return; toneAt(freq, actx.currentTime+(opts.when||0), dur, opts); }

const Snd = {
  move(){   tone(170,0.03,{type:'square',vol:0.04}); },
  rotate(){ tone(430,0.05,{type:'square',vol:0.07}); },
  lock(){   tone(150,0.07,{type:'triangle',vol:0.11, slideTo:90}); },
  clear(chain){ const b=520+chain*90; tone(b,0.10,{type:'square',vol:0.12}); tone(b*1.5,0.12,{type:'square',vol:0.07,when:0.05}); },
  virus(){  tone(880,0.10,{type:'square',vol:0.10}); tone(1320,0.13,{type:'square',vol:0.07,when:0.06}); },
  combo(n){ for(let i=0;i<3;i++) tone(440*Math.pow(1.26,i+Math.min(n,4)),0.09,{type:'square',vol:0.10,when:i*0.07}); },
  garbage(){ tone(150,0.16,{type:'sawtooth',vol:0.09, slideTo:80}); },
  attack(n, side){   // dramatická znělka útoku; nevěsta zní výš a jiným témbrem (poznat, kdo posílá)
    if(muted||!actx) return;
    const t=actx.currentTime+0.02;                  // nepatrný předstih, ať nesplyne se zvukem mazání
    const bride = side==='R';
    const mul  = bride ? 4/3 : 1;                    // nevěsta o čistou kvartu výš
    const lead = bride ? 'square' : 'sawtooth';      // + jiný tvar vlny
    const notes=[330,392,494,659,784];              // E G B E G — hlasitá vzestupná fanfára
    const steps=Math.max(3, Math.min(notes.length, 2+n));
    for(let i=0;i<steps;i++){
      toneAt(notes[i]*mul,   t+i*0.06, 0.16, {type:lead,     vol:0.20});   // výrazný vedoucí hlas
      toneAt(notes[i]/2*mul, t+i*0.06, 0.16, {type:'square', vol:0.08});   // spodní oktáva pro tělo
    }
    toneAt(98*mul, t, 0.34, {type:'sawtooth', vol:0.18, slideTo:60*mul});          // úderný basový doraz
    toneAt(notes[steps-1]*2*mul, t+steps*0.06, 0.28, {type:'square', vol:0.16});   // finální vysoký akcent
  },
  count(go){ tone(go?900:440,0.12,{type:'square',vol:0.13}); },
  die(){   // krátký smutný sestup při úmrtí — zazní ještě před výherní znělkou
    if(muted||!actx) return;
    const t=actx.currentTime;
    toneAt(392, t,      0.15, {type:'sawtooth', vol:0.18, slideTo:370});   // hned výrazný první tón
    toneAt(311, t+0.12, 0.16, {type:'sawtooth', vol:0.16, slideTo:294});   // D# → D
    toneAt(233, t+0.24, 0.42, {type:'sawtooth', vol:0.17, slideTo:147});   // A# → povadlé klesnutí (dřív)
  },
  menu(){   tone(600,0.045,{type:'square',vol:0.10}); },   // krátké cvaknutí při změně nastavení v menu
  win(){   // slavnostní svatební pochod (Mendelssohn – Svatební pochod, C dur)
    if(muted||!actx) return;
    const t0=actx.currentTime+0.05, q=0.30;          // délka čtvrťky (slavnostní tempo)
    const N={B4:494,C5:523,D5:587,E5:659,F5:698,G5:784,C6:1047};
    const mel=[
      // fanfára: opakované C, vzhůru na E
      [N.C5,1.5],[N.C5,0.5],[N.C5,1],[N.E5,1],           // C. C  C E
      [N.D5,1],[N.C5,1],[N.B4,1],[N.C5,1],               // D C B C  (obrat)
      // fanfára o tercii výš
      [N.E5,1.5],[N.E5,0.5],[N.E5,1],[N.G5,1],           // E. E  E G
      [N.F5,1],[N.E5,1],[N.D5,1],[N.C5,1],               // F E D C
      // slavnostní vzestupný rozklad C dur
      [N.C5,1],[N.E5,1],[N.G5,1],[N.C6,1],               // C E G C
      [N.G5,1],[N.E5,1],[N.C5,2],                        // G E C  (závěr)
    ];
    let t=t0; const starts=[];
    for(const [f,d] of mel){
      starts.push(t);
      toneAt(f,   t, d*q*0.9, {type:'square',   vol:0.15});   // melodie
      toneAt(f/2, t, d*q*0.9, {type:'triangle', vol:0.09});   // oktáva níž pro plnost
      t += d*q;
    }
    // slavnostní basový doprovod na těžkých dobách (C dur, V→I)
    toneAt(131, starts[0],  q*2.2, {type:'triangle', vol:0.13});  // C
    toneAt(98,  starts[4],  q*2.2, {type:'triangle', vol:0.13});  // G
    toneAt(131, starts[8],  q*2.2, {type:'triangle', vol:0.13});  // C
    toneAt(98,  starts[12], q*2.2, {type:'triangle', vol:0.13});  // G
    toneAt(131, starts[16], q*2.2, {type:'triangle', vol:0.13});  // C
    toneAt(98,  starts[20], q*1,   {type:'triangle', vol:0.13});  // G (dominanta)
    toneAt(131, starts[22], q*2.5, {type:'triangle', vol:0.14});  // C (závěr)
  },
};

// ================= GENEROVANÁ HUDBA NA POZADÍ =================
// Jednoduchý chiptune sekvencer s předstihovým plánováním (lookahead).
// Veselá svatební progrese v C dur (8 taktů), basa + arpeggio + melodie.
function midiHz(m){ return 440*Math.pow(2,(m-69)/12); }
const M_TEMPO = 116;                         // BPM (osminové kroky)
const M_PROG = [                             // 8 taktů po 8 krocích = 64 kroků smyčka (~16,5 s)
  {bass:36, ch:[60,64,67]},                  // C dur
  {bass:41, ch:[60,65,69]},                  // F dur
  {bass:45, ch:[57,60,64]},                  // a moll
  {bass:43, ch:[59,62,67]},                  // G dur
  {bass:36, ch:[60,64,67]},                  // C dur
  {bass:45, ch:[57,60,64]},                  // a moll
  {bass:41, ch:[60,65,69]},                  // F dur
  {bass:43, ch:[59,62,67]},                  // G dur
];
const M_LEAD = [                             // melodie (osminy, 0 = pauza) — 8 taktů
  72,0,71,72, 76,0,74,72,
  77,0,76,74, 72,0,69, 0,
  72,0,76,79, 77,0,76,74,
  74,0,72,71, 67,0,72, 0,
  // druhá polovina (takty 5–8)
  72,0,76,79, 76,0,72,74,
  76,0,72,69, 72,0,74, 0,
  77,0,81,79, 77,0,74,72,
  74,0,71,74, 67,0,72, 0,
];
const music = { on:false, step:0, nextTime:0, timer:null };
let musicShouldPlay = () => true;            // háček: kdy smí hudba hrát (index → jen ve hře, mimo pauzu)
let musicRateFn = () => 1;                   // háček: násobič tempa (index → zrychluje s pádem kapslí)
function musicStart(){
  if(music.on || muted || !actx || !musicShouldPlay()) return;
  music.on=true; music.step=0; music.nextTime=actx.currentTime+0.12;
  music.timer=setInterval(musicScheduler, 25);
}
function musicStop(){
  music.on=false;
  if(music.timer){ clearInterval(music.timer); music.timer=null; }
}
function musicStep(step, t){
  const bar=(step>>3) % M_PROG.length, beat=step&7, chord=M_PROG[bar];
  if(beat===0 || beat===4) toneAt(midiHz(chord.bass), t, 0.36, {type:'triangle', vol:0.15});   // basa
  if((beat&1)===0){ const n=chord.ch[(beat>>1)%chord.ch.length]; toneAt(midiHz(n), t, 0.16, {type:'square', vol:0.045}); } // arpeggio
  const lead=M_LEAD[step];
  if(lead) toneAt(midiHz(lead), t, 0.20, {type:'square', vol:0.06});                            // melodie
}
function musicScheduler(){
  if(!music.on) return;
  if(!actx || !musicShouldPlay()){ musicStop(); return; }   // pojistka: stav se změnil
  const spStep = 60/M_TEMPO/2/musicRateFn();   // délka osminového kroku v sekundách (zrychluje s hrou)
  while(music.nextTime < actx.currentTime + 0.20){
    musicStep(music.step, music.nextTime);
    music.nextTime += spStep;
    music.step = (music.step+1) % M_LEAD.length;
  }
}
