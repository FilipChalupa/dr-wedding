#!/usr/bin/env node
// Přejmenuje sdílené skripty na název s hashem obsahu (audio.js → audio.<hash8>.js)
// a přepíše odkazy na ně v HTML stránkách a service workeru.
//
// Proč: index.html a sdílené skripty se cachují nezávisle (service worker je cache first,
// před ním ještě Cloudflare). Klient tak mohl dostat NOVÝ index.html se STARÝM audio.js —
// a volání funkce, která ve staré verzi neexistuje, spadne (viz zamrzlý přípitek L1+R1).
// Hash v názvu znamená, že jiný obsah má jinou URL, takže rozjetá dvojice nemůže vzniknout.
//
// Spusť po KAŽDÉ úpravě audio*.js / statsview*.js:
//   node tools/hash-assets.js
// Je to idempotentní — když názvy odpovídají obsahu, nic nezmění.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');

const BASES = ['audio', 'statsview'];                            // spravované sdílené skripty
const REFS = ['index.html', 'stats.html', 'sounds.html', 'sw.js'];   // kde se na ně odkazuje

let changed = false;
for(const base of BASES){
  const fileRe = new RegExp('^' + base + '(\\.[0-9a-f]{8})?\\.js$');
  const found = fs.readdirSync(ROOT).filter(f => fileRe.test(f));
  if(found.length !== 1){
    console.error('Čekám právě jeden soubor ' + base + '[.<hash>].js, našel jsem: ' + (found.join(', ') || 'nic'));
    process.exitCode = 1;
    continue;
  }
  const cur = found[0];
  const hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, cur))).digest('hex').slice(0, 8);
  const next = base + '.' + hash + '.js';
  if(cur !== next){
    fs.renameSync(path.join(ROOT, cur), path.join(ROOT, next));
    console.log(cur + ' → ' + next);
    changed = true;
  }
  const refRe = new RegExp(base.replace('.', '\\.') + '(\\.[0-9a-f]{8})?\\.js', 'g');
  for(const rf of REFS){
    const p = path.join(ROOT, rf);
    const s = fs.readFileSync(p, 'utf8');
    const s2 = s.replace(refRe, next);
    if(s2 !== s){
      fs.writeFileSync(p, s2);
      console.log(rf + ': odkazy → ' + next);
      changed = true;
    }
  }
}
if(!changed) console.log('Beze změny — názvy už odpovídají obsahu.');
