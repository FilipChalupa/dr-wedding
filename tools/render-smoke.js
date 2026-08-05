#!/usr/bin/env node
// Render smoke-test: prožene SKUTEČNÉ kreslicí cesty (menu, hra, výherní obrazovka, combo
// hlášky, přípitek, „Ano" pokývnutí, poletující srdíčka…) přes podstrčený Canvas a SPADNE,
// jakmile některá vyhodí výjimku.
//
// Proč existuje: herní smyčka má kolem kreslení try/catch (aby jednorázová chyba neshodila
// kiosk), takže rozbitý easter egg by se jen TIŠE nevykreslil a nikdo by si nevšiml. Tenhle
// test to odhalí. Pouštěj po každém zásahu do render kódu.
//
// Použití:
//   node tools/render-smoke.js                 # aktuální index.html
//   node tools/render-smoke.js /tmp/old.html   # porovnej jinou verzi

const path = require('path');
const { ROOT, runGame } = require('./harness-env');
const GAME_FILE = process.argv[2] || path.join(ROOT, 'index.html');

const TEST = `
;(function(){
  const mkgrid = () => { const g=new Array(COLS*ROWS).fill(null); spawnViruses(g,16,5); return g; };
  players = [newPlayer('L'), newPlayer('R')];
  for(const p of players){ p.grid=mkgrid(); p.pillIdx=0; p.next=pillAt(0); const pp=pillAt(0); p.pill={r:0,c:3,orient:0,ca:pp.ca,cb:pp.cb}; p.virusCount=countViruses(p.grid); p.comboTimer=40; }
  audioInit();

  let errs=0;
  const tryF=(name,fn)=>{ try{ fn(); }catch(e){ errs++; console.log('CHYBA ['+name+']:', e.message); } };
  const expect=(cond,msg)=>{ if(!cond){ errs++; console.log('OČEKÁVÁNÍ selhalo:', msg); } };

  // combo hlášky (obě strany, i délky s auto-zmenšením a „Kombo N×")
  for(const n of [2,3,4,5,7]){ players[0].comboN=n; players[1].comboN=n; frameCount=n;
    tryF('combo L '+n, ()=>drawBoard(players[0], LX0));
    tryF('combo R '+n, ()=>drawBoard(players[1], RX0)); }
  expect(comboText(2,'L')==='Mám tě rád',  'combo 2 ženich = „Mám tě rád"');
  expect(comboText(2,'R')==='Mám tě ráda', 'combo 2 nevěsta = „Mám tě ráda"');
  expect(comboText(3,'L')==='Miluji tě',   'combo 3 = „Miluji tě"');
  expect(comboText(4,'L')==='Hyjé koníčku', 'combo 4 = „Hyjé koníčku" (bez tečky, viz 2ce6225)');
  expect(comboText(5,'L')==='Kombo 5×',    'combo 5 = „Kombo 5×"');

  mode='menu'; tryF('drawMenu', drawMenu);
  anoTimer=ANO_FRAMES; for(let i=0;i<4;i++){ frameCount+=14; tryF('drawMenu +Ano pokývnutí', drawMenu); } anoTimer=0;
  glassTimer=[GLASS_FRAMES,0]; tryF('drawMenu +sklenička ženich', drawMenu);
  glassTimer=[0,GLASS_FRAMES]; tryF('drawMenu +sklenička nevěsta', drawMenu); glassTimer=[0,0];
  tryF('Snd.ano', ()=>Snd.ano());

  mode='play'; tryF('drawPlay', drawPlay);
  players[0].side='L'; players[1].side='R'; spawnHearts(players[0]); spawnHearts(players[1]);
  for(let i=0;i<3;i++){ frameCount+=5; for(const p of players){ for(const h of p.hearts){ h.life--; h.y-=h.vy; h.x+=Math.sin(h.sway+=0.12)*0.5; } p.hearts=p.hearts.filter(h=>h.life>0); } tryF('drawPlay +srdíčka', drawPlay); }
  toastTimer=TOAST_FRAMES; tryF('drawToast (přípitek)', drawToast);

  overStartFrame=frameCount;
  mode='over'; isDraw=false; winner=players[1]; for(let i=0;i<6;i++){ frameCount+=30; tryF('drawOver – výhra nevěsty (kytice)', drawOver); }
  overStartFrame=frameCount; winner=players[0]; for(let i=0;i<3;i++){ frameCount+=30; tryF('drawOver – výhra ženicha', drawOver); }
  isDraw=true; tryF('drawOver – remíza', drawOver);

  globalThis.__renderSmokeErrs = errs;
  if(!errs) console.log('OK: všechny kreslicí cesty prošly (combo, menu, Ano, skleničky, hra, srdíčka, přípitek, výhra/remíza)');
})();
`;

runGame(GAME_FILE, TEST);
if (globalThis.__renderSmokeErrs) { console.error('RENDER SMOKE SELHAL: ' + globalThis.__renderSmokeErrs + ' chyb(a)'); process.exit(1); }
