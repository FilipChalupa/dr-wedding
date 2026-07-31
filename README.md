# 💍 Dr. Wedding

Retro svatební hra ve stylu **Dr. Mario** — multiplayer pro dva hráče, ženich proti nevěstě.
Čistá webovka bez instalace, s generovaným retro pípáním i hudbou na pozadí (lze vypnout),
stylizovaná do staré CRT televize 4:3.

![](cartridge.png)

## Spuštění

Otevři [`public/index.html`](public/index.html) v prohlížeči (stačí dvojklik). Nic víc není
potřeba — žádný server, žádné závislosti. (Ve složce [`public/`](public/) je vše, co se
nasazuje na web; zbytek repa jsou nástroje a dokumentace.)

Pro nejlepší zážitek klikni na **⛶ FULLSCREEN** (nebo stiskni `F`).

## Jak se hraje

Padají dvoubarevné kapsle. Srovnej **4 a více stejných barev** vedle sebe (vodorovně
nebo svisle) a smažou se i s „starostmi" (svatební breberky). Kdo první vyčistí ze své
sklenice všechny starosti, **vyhrává**. Komba posílají soupeři do sklenice smetí navíc.

Před každým kolem proběhne odpočet **3·2·1**, nad sklenicí je vidět **náhled další kapsle**
a hru lze kdykoli **pozastavit** (klávesa `P` nebo tlačítko Start na ovladači).

Barvy: 🟣 fialová · 🟡 zlatá (šampaňské) · 🩷 růžová.

### Ovládání

| Akce      | Ženich (vlevo) | Nevěsta (vpravo) |
|-----------|----------------|------------------|
| Doleva    | `A`            | `←`              |
| Doprava   | `D`            | `→`              |
| Otočit    | `W`            | `↑`              |
| Dolů      | `S`            | `↓`              |

Pauza ve hře: `P` (klávesnice) nebo **Start** (ovladač).
Zvuk i hudbu na pozadí zapnout/vypnout: `M` (volba se pamatuje).

### USB ovladače

Ovladač **0 → ženich**, ovladač **1 → nevěsta** (v sólo hře ovládá člověka libovolný
ovladač). Pohyb je přes **D-pad** nebo **levou páčku**. Přední 4 tlačítka (diamant vpravo)
otáčejí blokem na obě strany — úhlopříčné dvojice se točí stejně:

| Tlačítko (standard) | Otočení |
|---------------------|---------|
| **A** (dole) + **Y** (nahoře) | po směru hodinových ručiček |
| **B** (vpravo) + **X** (vlevo) | proti směru |

Křížek **nahoru** otáčí po směru, **Start** pauzuje. (Fyzické rozložení se může u různých
ovladačů lišit — pokud by dvojice seděly opačně, dají se v `readPad` prohodit indexy tlačítek.)

V menu: nahoru/dolů (`W`/`S`, šipky nebo ovladač) přepíná mezi *dva hráči* a *vs počítač*
(na trénink sólo); doleva/doprava (`A`/`D`, šipky nebo ovladač) nastavuje **počet starostí**
(5 úrovní obtížnosti) · `Enter` (nebo A/Start na ovladači) = start · `F` = fullscreen.

> Pozn.: hru nelze odstartovat ani ukončit kliknutím na obrazovku — slouží k tomu jen
> klávesnice, ovladač, nebo tlačítko **START** pod televizí.

## Režim `?tv` (pro fyzickou televizi)

Když se hra pouští na opravdové (fyzické) televizi, přidej do URL parametr **`?tv`**:

```
index.html?tv
```

V tomto režimu se **skryjí všechny extra prvky** — hnědá retro skříň televize i tlačítka
**START** a **FULLSCREEN** pod ní. Zůstane jen samotný herní obraz roztažený přes celou
plochu obrazovky (zachová poměr stran 4:3, zbytek je černý). Hra se tak na fyzické televizi
zobrazí jako čistá celoobrazovková aplikace bez rušivých webových prvků.

> Tip: ovládat menu i start jde čistě z klávesnice (`1`/`2`, `Enter`), takže v `?tv` režimu
> nejsou tlačítka potřeba. Na dotykovém displeji lze menu odbavit i klepnutím na obraz.

## Statistiky

Každá dohraná hra se automaticky ukládá do prohlížeče (localStorage) — kdy začala, jak
dlouho trvala, obtížnost (počet starostí), režim (dva hráči / vs počítač) a kdo vyhrál.

Statistiky si zobrazíš třemi způsoby:

- tlačítkem **📊 STATISTIKY** pod televizí (mimo režim `?tv`),
- **skrytým ovladačovým kombem přímo ve hře** (viz níže) — jediná cesta na fyzické
  televizi v režimu `?tv`, kde tlačítka nejsou,
- otevřením samostatné stránky [`stats.html`](public/stats.html).

Nahoře je **celkový souhrn** napříč všemi dny (kolikrát vyhrál ženich/nevěsta, počet her,
celkový a nejdelší čas). Níže jsou hry seskupené **po dnech** — šipkami *Novější / Starší*
listuješ mezi dny; u každého dne je denní souhrn a tabulka her se skóre. Na samostatné
stránce `stats.html` je dole i tlačítko **🗑 Vymazat statistiky** (s potvrzením); herní
překryv ho záměrně nemá, aby na svatbě nešlo statistiky omylem smazat.

### Skryté combo pro statistiky (kiosk)

Aby na statistiky běžný host nenarazil, otevírají se v menu **skrytým kombem**:

- **Ovladač:** podrž **`Select`** a **5× po sobě** zmáčkni **`Start`** (každý stisk 1–4
  cvakne, pátý otevře; když `Select` pustíš, počítadlo se vynuluje).
- **Klávesnice:** `Tab`.

Statistiky se ukážou jako **překryv přes hru**. Ovládání uvnitř: **`←` / `→`** listuje dny,
**`↑` / `↓`** roluje, **`A` / `Start` / `Select`** (nebo `Enter` / `Esc`) = zpět do hry.

> Pozn.: data se ukládají lokálně přes `localStorage` v daném prohlížeči a počítači;
> nikam se neodesílají. (localStorage zvolen místo IndexedDB, protože spolehlivě funguje
> i při otevření přes `file://` a sdílí se mezi `index.html` a `stats.html`.)

## Offline provoz

Hra funguje offline. Při otevření přímo ze souboru (`file://`, dvojklik) žádný server
nepotřebuje, takže běží offline rovnou. Když je **hostovaná přes http(s)** (server / GitHub
Pages), stará se o offline `sw.js` (service worker) se strategií **cache first
(stale-while-revalidate)**: co je v cache, vrátí se okamžitě a nezávisle na síti, a čerstvá
verze se mezitím stáhne na pozadí pro příští načtení. Co v cache není, dotáhne ze sítě.

Je to zvolené kvůli kiosku: na akci je síť ta nejméně spolehlivá součást. Kdyby WiFi *byla*,
ale nefungovala, „network first" by čekal na timeout u každého souboru a start by se vlekl.

> **Pozor:** nová verze se díky tomu projeví až při **druhém** načtení — poprvé se ještě
> podá ta z cache a čerstvá se jen stáhne na pozadí. Na kiosku tedy po nasazení stránku
> načtěte dvakrát (nebo hru restartujte dvakrát).

Sdílené skripty (`audio.*.js`, `statsview.*.js`) a náhledový obrázek pro sociální sítě
(`og.*.jpg`) mají v názvu **hash obsahu**, aby si klient nemohl nakombinovat nový
`index.html` se starou verzí souboru z cache (service worker i Cloudflare cachují každý
soubor zvlášť). Po každé úpravě těchto souborů spusť `node tools/hash-assets.js` —
soubor přejmenuje podle nového obsahu a přepíše odkazy v HTML i `sw.js`.

> Service worker funguje jen přes http(s) nebo `localhost` (ne přes `file://`). Vyzkoušet se
> dá lokálně: `python3 -m http.server` ve složce `public/`, otevřít `http://localhost:8000/`,
> načíst jednou online a pak v DevTools zapnout *Offline* (nebo vypnout server) — hra se
> načte dál.

## Velikonoční vajíčka

- **Výročí svatby** — od prvního výročí (rok po svatbě) se v den výročí v menu spustí
  ohňostroj a nápis „Šťastné X. výročí!". Datum se nastavuje v `index.html` konstantou
  `WEDDING = { year, month, day }`.

## Téma

- **Ženich** (vlevo) — šedý oblek, fialový motýlek, krátké tmavě blond vlasy, stojí u své sklenice.
- **Nevěsta** (vpravo) — klasické bílé šaty, tmavě blond vlasy po ramena, kytice, u své sklenice.
- Obě postavičky se houpou a vyskočí radostí, když se jim něco smaže.
- Po výhře: „PRÁVĚ SEZDÁNI!", oba spolu, létající srdíčka a koruna nad vítězem.

## Ladění AI

Počítačový soupeř se řídí hodnotící funkcí `aiEval` a třemi konstantami v
[`index.html`](index.html), u kterých jsou v komentáři naměřené tabulky:

| konstanta | co dělá |
|---|---|
| `AI_VERT_MIX_PEN` | postih za **dvoubarevnou kapsli nastojato** (ta si zamkne barvu pod barvou) |
| `AI_HORIZ_W` | jak moc se smí snažit stavět **vodorovné** čtveřice |
| `AI_ADJ_W` | odměna za **skládání stejných barev** na sebe |
| `AIK` | kolik nejlepších tahů promýšlí do hloubky (menší = zahodí i dobrý tah) |
| `AI_PACE_USE`, `AI_PACE_MAX` | **tempo** — jak rozvážně kapslí otáčí a posouvá |

Chování AI se nedá poznat od stolu ani z jedné odehrané partie — pár set tahů vypadá
náhodně a člověk si k tomu snadno vymyslí špatné vysvětlení. Proto je v repu měřicí
harness [`tools/ai-sim.js`](tools/ai-sim.js): načte `public/index.html` do Node s podstrčeným
DOM, odsimuluje celé partie a vypíše tvrdá čísla (jak kapsle pokládá, jak maže viry,
jak si zasypává starosti a jak je silná).

```bash
node tools/ai-sim.js               # výchozí nastavení, 80 partií
GAMES=200 node tools/ai-sim.js     # víc partií = míň šumu
ADJ=50 node tools/ai-sim.js        # zkus jinou hodnotu bez editace kódu
VPEN=0 HW=1 node tools/ai-sim.js   # chování před laděním AI

# porovnání se starší verzí
git show HEAD~5:public/index.html > /tmp/old.html && node tools/ai-sim.js /tmp/old.html
```

> Čísla mají šum. Rozdíl pod ~0,3 zbylého viru při 80 partiích neznamená nic —
> na závěry o síle je potřeba aspoň `GAMES=150`.

`ai-sim.js` pokládá kapsle rovnou na cíl, takže neřeší, jestli je tam AI **stihne dovézt**.
Na to je [`tools/ai-pace-test.js`](tools/ai-pace-test.js), který simuluje smyčku snímek po
snímku. Pusť ho po každém zásahu do tempa — hlídá, že kapsle nedopadne po cestě:

```bash
node tools/ai-pace-test.js             # start hry (95 snímků na řádek)
SPEED=22 node tools/ai-pace-test.js    # nejvyšší rychlost — tady to praská nejdřív
```

> „MINULO CIL" má zůstat kolem **0,2 %**. Když povyskočí (klidně na 3 %), manévruje AI
> pomaleji, než stíhá, a pokládá kapsle jinam, než plánovala.

Ani jeden z předchozích testů nesáhne na `updatePlayer()`, kde žije **zámek po dosednutí**
(`LOCK_DELAY`). Na tohle je [`tools/lock-delay-test.js`](tools/lock-delay-test.js), který
žene skutečnou snímkovou smyčku a měří, kolik snímků kapsle **visí u dna**, než zapadne:

```bash
node tools/lock-delay-test.js               # aktuální verze, start (95) i max (22)
node tools/lock-delay-test.js /tmp/old.html # porovnej se starší verzí (git show HEAD^:public/index.html)
```

> „Visí u dna" je přesně ta prodleva, kvůli které lidé ucukávali (mysleli, že už ovládají
> další kapsli). Se zámkem po dosednutí spadla na startu hry z ~96 snímků (1,6 s) na 16
> snímků (0,27 s); s drženým „dolů" na ~4 snímky (polož hned).

Herní smyčka polyká chyby v kreslení (`try/catch`), takže rozbitý easter egg by se jen tiše
nevykreslil. [`tools/render-smoke.js`](tools/render-smoke.js) prožene všechny kreslicí cesty
(menu, hra, výhra, combo hlášky, přípitek, „Ano", srdíčka…) a **spadne s nenulovým kódem**,
když některá vyhodí výjimku — pouštěj po zásazích do render kódu:

```bash
node tools/render-smoke.js
```

> Podstrčené DOM/Canvas/WebAudio pro všechny čtyři node harnessy je ve sdíleném
> [`tools/harness-env.js`](tools/harness-env.js) (`runGame(soubor, testovacíKód)`).

## Technické

Vše je v jediném souboru [`public/index.html`](public/index.html) — HTML, CSS i JavaScript (vanilla,
`<canvas>`). Žádné externí knihovny, žádné fonty z internetu, funguje i offline.
Vykreslování běží v PAL rozlišení 720×576 (vnitřní herní souřadnice 320×240 se škálují
nahoru), zobrazené v poměru 4:3 jako na staré televizi.
