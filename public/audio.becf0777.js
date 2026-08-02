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
  attack(n, side){   // znělka útoku — ženich a nevěsta mají VÝRAZNĚ jinou znělku (poznat, kdo posílá)
    if(muted||!actx) return;
    const t=actx.currentTime+0.02;                  // nepatrný předstih, ať nesplyne se zvukem mazání
    const steps=Math.max(3, Math.min(5, 2+n));      // víc smetí = delší
    if(side==='R'){
      // NEVĚSTA: jasná, vysoká, třpytivá vzestupná zvonkohra (square + triangle)
      const notes=[523,659,784,988,1319];           // C5 E5 G5 B5 E6 — svítivý vzestup
      for(let i=0;i<steps;i++){
        toneAt(notes[i],   t+i*0.05, 0.14, {type:'square',   vol:0.18});   // vedoucí zvonek
        toneAt(notes[i]*2, t+i*0.05, 0.10, {type:'triangle', vol:0.06});   // třpyt o oktávu výš
      }
      toneAt(notes[steps-1]*1.5, t+steps*0.05, 0.26, {type:'triangle', vol:0.14});  // závěrečný cinkot
      toneAt(392, t, 0.22, {type:'triangle', vol:0.07});                            // jemný lehký spodek
    } else {
      // ŽENICH: těžká, nízká, drsná sestupná fanfára (sawtooth) + úderný bas
      const notes=[330,262,196,147,110];            // E4 C4 G3 D3 A2 — hrozivý sestup
      for(let i=0;i<steps;i++){
        toneAt(notes[i],   t+i*0.07, 0.18, {type:'sawtooth', vol:0.20});   // drsný vedoucí hlas
        toneAt(notes[i]*2, t+i*0.07, 0.12, {type:'square',   vol:0.06});   // oktáva výš pro tělo
      }
      toneAt(73, t, 0.40, {type:'sawtooth', vol:0.20, slideTo:44});                             // úderný basový doraz
      toneAt(notes[steps-1], t+steps*0.07, 0.34, {type:'sawtooth', vol:0.16, slideTo:notes[steps-1]*0.75});  // závěrečné zavrčení
    }
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
  ano(){   // tiché „a-no" u oltáře (skryté kombo v menu: oba naráz zmáčknou start)
    if(muted||!actx) return;
    const t=actx.currentTime;
    toneAt(523, t,      0.16, {type:'triangle', vol:0.12});   // „a"
    toneAt(784, t+0.15, 0.34, {type:'triangle', vol:0.12});   // „no" — o kvintu výš
    toneAt(1047,t+0.15, 0.34, {type:'sine',     vol:0.05});   // jemný třpyt navrch
  },
  toast(){   // „cink" skleniček na přípitek (skryté kombo: oba drží L1+R1) — jasný, sklovitý, doznívá
    if(muted||!actx) return;
    const t=actx.currentTime;
    toneAt(1568, t,       0.55, {type:'triangle', vol:0.11, attack:0.001});   // G6 — vedoucí zvon
    toneAt(2093, t+0.004, 0.50, {type:'sine',     vol:0.06, attack:0.001});   // C7 — třpyt
    toneAt(3136, t,       0.22, {type:'sine',     vol:0.03, attack:0.001});   // vysoká jiskra
  },
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
// Chiptune sekvencer s předstihovým plánováním (lookahead). Šest skladeb podle
// obtížnosti — vybírá musicSelect() z index.html při startu hry:
//   'f' osudová (d moll, těžká)        → úrovně 0–1
//   'b' kánon (pachelbelovská procesí) → úrovně 2–3
//   'a' rozšířená svatební (AABA)      → úroveň 4
//   'c' slavnostní valčík (3/4)        → úroveň 5
//   'd' bouřková toccata (a moll)      → hardcore 6
//   'e' hon (e moll, pumpující basa)   → super-hardcore 7
function midiHz(m){ return 440*Math.pow(2,(m-69)/12); }
// akordy: basa (MIDI) + tóny pro arpeggio/stab
const CH_C ={bass:36,ch:[60,64,67]}, CH_F ={bass:41,ch:[60,65,69]}, CH_Am={bass:45,ch:[57,60,64]},
      CH_G ={bass:43,ch:[59,62,67]}, CH_Dm={bass:38,ch:[62,65,69]}, CH_Em={bass:40,ch:[59,64,67]},
      CH_E ={bass:40,ch:[59,64,68]}, CH_B7={bass:35,ch:[59,63,66]}, CH_D ={bass:38,ch:[62,66,69]},
      CH_A ={bass:45,ch:[57,61,64]}, CH_Gm={bass:43,ch:[62,67,70]}, CH_Bb={bass:46,ch:[58,62,65]};
const M_SONGS = {
  a:{ tempo:116, barLen:8, waltz:false,      // rozšířená svatební: sloka · odpověď · most · finále
    prog:[CH_C,CH_F,CH_Am,CH_G, CH_C,CH_F,CH_Am,CH_G, CH_Dm,CH_G,CH_Em,CH_Am, CH_F,CH_G,CH_C,CH_G],
    lead:[72,0,71,72, 76,0,74,72, 77,0,76,74, 72,0,69,0,     // A — původní téma
          72,0,76,79, 77,0,76,74, 74,0,72,71, 67,0,72,0,
          76,0,74,76, 79,0,77,76, 81,0,79,77, 76,0,72,0,     // A' — odpověď výš
          76,0,72,76, 81,0,79,77, 79,0,77,74, 71,0,74,0,
          74,0,77,74, 69,0,74,77, 79,0,74,71, 74,0,67,0,     // B — most (d moll)
          76,0,71,76, 79,0,76,71, 72,0,76,72, 69,0,64,0,
          77,0,76,77, 81,0,79,77, 79,0,79,81, 83,0,81,79,    // finále — stoupavý běh
          84,0,79,76, 72,0,76,79, 74,76,77,79, 83,0,84,0] },
  b:{ tempo:104, barLen:8, waltz:false,      // kánon: půlové tóny → osminové figurace
    prog:[CH_C,CH_G,CH_Am,CH_Em,CH_F,CH_C,CH_F,CH_G, CH_C,CH_G,CH_Am,CH_Em,CH_F,CH_C,CH_F,CH_G],
    lead:[76,0,0,0, 72,0,0,0, 74,0,0,0, 71,0,0,0,
          72,0,0,0, 69,0,0,0, 71,0,0,0, 67,0,0,0,
          69,0,0,0, 65,0,0,0, 67,0,0,0, 72,0,0,0,
          69,0,0,0, 72,0,0,0, 74,0,0,0, 71,0,0,0,
          72,76,79,76, 84,79,76,72, 71,74,79,74, 83,79,74,71,
          69,72,76,72, 81,76,72,69, 67,71,76,71, 79,76,71,67,
          65,69,72,69, 77,72,69,65, 64,67,72,67, 76,72,67,64,
          65,69,72,77, 81,77,72,69, 67,71,74,79, 83,0,79,0] },
  c:{ tempo:150, barLen:6, waltz:true,       // valčík: um-pa-pa, durová sloka · mollový střed · návrat
    prog:[CH_C,CH_G,CH_C,CH_G, CH_C,CH_F,CH_G,CH_C, CH_Am,CH_E,CH_Am,CH_G, CH_F,CH_C,CH_Dm,CH_G,
          CH_F,CH_C,CH_G,CH_C, CH_F,CH_C,CH_G,CH_C],
    lead:[67,0,72,0,76,0, 74,0,71,0,74,0, 76,0,72,0,67,0, 74,0,71,0,0,0,
          67,0,72,0,76,0, 77,0,74,0,69,0, 74,0,71,0,74,0, 72,0,0,0,0,0,
          69,0,72,0,76,0, 76,0,71,0,68,0, 69,0,72,0,76,0, 79,0,74,0,71,0,
          77,0,81,0,77,0, 76,0,72,0,76,0, 74,0,77,0,74,0, 71,0,74,0,79,0,
          81,0,77,0,72,0, 76,0,79,0,84,0, 83,0,79,0,74,0, 76,0,72,0,76,0,
          77,0,76,0,74,0, 76,0,72,0,69,0, 74,0,71,0,74,0, 72,0,0,0,0,0] },
  d:{ tempo:132, barLen:8, waltz:false,      // bouřková toccata (a moll + harmonická G#)
    prog:[CH_Am,CH_F,CH_Dm,CH_E, CH_Am,CH_F,CH_Dm,CH_E, CH_Am,CH_G,CH_C,CH_E, CH_Dm,CH_Am,CH_E,CH_Am],
    lead:[69,0,72,76, 81,0,79,76, 77,0,76,72, 69,0,72,0,
          74,0,77,74, 69,0,74,77, 76,75,76,80, 83,0,80,76,
          81,0,79,81, 84,0,81,79, 77,0,81,77, 72,0,77,81,
          81,0,79,77, 74,0,77,0,  80,0,76,80, 83,80,76,71,
          69,71,72,74, 76,0,72,76, 79,0,74,79, 83,0,79,74,
          84,0,79,76, 72,0,76,79, 80,0,83,80, 76,0,71,68,
          74,0,77,81, 86,0,81,77, 84,0,81,76, 72,0,76,81,
          83,0,80,76, 75,0,76,80, 81,0,76,72, 69,0,57,0] },
  e:{ tempo:144, barLen:8, waltz:false, drive:true,   // hon (e moll štvanice, basa pumpuje v osminách)
    prog:[CH_Em,CH_C,CH_Am,CH_B7, CH_Em,CH_C,CH_Am,CH_B7, CH_G,CH_D,CH_Em,CH_B7, CH_C,CH_Am,CH_B7,CH_Em],
    lead:[76,0,79,76, 71,0,76,79, 79,0,76,72, 76,0,72,67,
          69,0,72,76, 81,0,76,72, 75,0,71,75, 78,0,75,71,
          76,79,83,79, 76,0,79,83, 84,0,79,76, 72,0,76,79,
          81,0,84,81, 76,0,81,84, 87,0,83,78, 75,0,78,83,
          79,0,74,71, 67,0,71,74, 78,0,74,69, 66,0,69,74,
          76,0,71,67, 64,0,67,71, 75,0,71,66, 63,0,66,71,
          72,74,76,77, 79,0,76,72, 81,0,79,76, 72,0,76,79,
          83,0,78,75, 71,0,75,78, 76,0,71,76, 79,76,71,64] },
  f:{ tempo:100, barLen:8, waltz:false,      // osudová (d moll, pomalá a těžká)
    prog:[CH_Dm,CH_Gm,CH_A,CH_Dm, CH_F,CH_Bb,CH_Gm,CH_A, CH_Dm,CH_C,CH_Bb,CH_A, CH_Dm,CH_Gm,CH_A,CH_Dm],
    lead:[74,0,0,0, 77,0,74,0,  79,0,0,0, 74,0,70,0,
          73,0,0,0, 76,0,73,0,  74,0,0,0, 0,0,69,0,
          77,0,0,0, 81,0,77,0,  82,0,0,0, 77,0,74,0,
          79,0,74,0, 70,0,74,0, 73,0,76,0, 81,0,0,0,
          86,0,0,0, 81,0,77,0,  84,0,79,0, 76,0,79,0,
          82,0,77,0, 74,0,77,0, 81,0,76,0, 73,0,69,0,
          74,77,81,77, 74,0,86,0, 79,0,82,79, 74,0,79,0,
          81,0,73,76, 69,0,73,76, 74,0,0,0, 62,0,0,0] },
};
let musicSongKey = 'a';
function musicSelect(k){ if(M_SONGS[k]) musicSongKey = k; }   // volá index.html při startu hry
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
function musicStep(song, step, t){
  const bar=(step/song.barLen|0)%song.prog.length, beat=step%song.barLen, chord=song.prog[bar];
  if(song.waltz){                            // 3/4: basa + „um-pa-pa" stab na 2. a 3. dobu
    if(beat===0) toneAt(midiHz(chord.bass), t, 0.34, {type:'triangle', vol:0.15});
    if(beat===2||beat===4){
      toneAt(midiHz(chord.ch[0]), t, 0.12, {type:'square', vol:0.03});
      toneAt(midiHz(chord.ch[2]), t, 0.12, {type:'square', vol:0.03});
    }
  } else if(song.drive){                     // štvanice: basa pumpuje v osminách, arpeggio jen přizvukuje
    if((beat&1)===0) toneAt(midiHz(chord.bass), t, 0.20, {type:'triangle', vol:0.14});
    if(beat===1||beat===5){ const n=chord.ch[(beat>>1)%chord.ch.length]; toneAt(midiHz(n), t, 0.14, {type:'square', vol:0.04}); }
  } else {                                   // 4/4: basa na těžké doby, arpeggio na sudé
    if(beat===0 || beat===4) toneAt(midiHz(chord.bass), t, 0.36, {type:'triangle', vol:0.15});
    if((beat&1)===0){ const n=chord.ch[(beat>>1)%chord.ch.length]; toneAt(midiHz(n), t, 0.16, {type:'square', vol:0.045}); }
  }
  const lead=song.lead[step];
  if(lead) toneAt(midiHz(lead), t, song.waltz?0.24:0.20, {type:'square', vol:0.06});   // melodie
}
function musicScheduler(){
  if(!music.on) return;
  if(!actx || !musicShouldPlay()){ musicStop(); return; }   // pojistka: stav se změnil
  const song = M_SONGS[musicSongKey];
  const spStep = 60/song.tempo/2/musicRateFn();   // délka osminového kroku v sekundách (zrychluje s hrou)
  while(music.nextTime < actx.currentTime + 0.20){
    musicStep(song, music.step, music.nextTime);
    music.nextTime += spStep;
    music.step = (music.step+1) % song.lead.length;
  }
}

// ================= TICHÁ HUDBA V PAUZE =================
// Pomalý, měkký a tichý rozklad (jiná nálada než herní hudba) — hraje jen během pauzy.
const PM_STEP = 0.62;                        // sekundy na krok (klidné tempo)
const PM_NOTES = [                           // pomalé rozklady (C dur → a moll → F → G), 0 = pauza
  60,64,67,72, 71,67,
  57,60,64,69, 67,64,
  53,57,60,65, 64,60,
  55,59,62,67, 65,62,
];
const PM_BASS = [48, 45, 41, 43];            // basa na začátku každého taktu (6 kroků)
const pauseMusic = { on:false, step:0, nextTime:0, timer:null };
function pauseMusicStart(){
  if(pauseMusic.on || muted || !actx) return;
  pauseMusic.on=true; pauseMusic.step=0; pauseMusic.nextTime=actx.currentTime+0.15;
  pauseMusic.timer=setInterval(pauseMusicScheduler, 40);
}
function pauseMusicStop(){
  pauseMusic.on=false;
  if(pauseMusic.timer){ clearInterval(pauseMusic.timer); pauseMusic.timer=null; }
}
function pauseMusicScheduler(){
  if(!pauseMusic.on) return;
  if(muted || !actx){ pauseMusicStop(); return; }
  while(pauseMusic.nextTime < actx.currentTime + 0.3){
    const s=pauseMusic.step, n=PM_NOTES[s];
    if(s % 6 === 0) toneAt(midiHz(PM_BASS[(s/6)|0 % PM_BASS.length]), pauseMusic.nextTime, 2.2, {type:'triangle', vol:0.05});  // měkká basa/pad
    if(n) toneAt(midiHz(n), pauseMusic.nextTime, 1.1, {type:'triangle', vol:0.05});   // tichý rozklad
    pauseMusic.nextTime += PM_STEP;
    pauseMusic.step = (s+1) % PM_NOTES.length;
  }
}
