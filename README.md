# 💍 Dr. Wedding

Retro svatební hra ve stylu **Dr. Mario** — multiplayer pro dva hráče, ženich proti nevěstě.
Čistá webovka bez instalace, s generovaným retro pípáním i hudbou na pozadí (lze vypnout),
stylizovaná do staré CRT televize 4:3.

## Spuštění

Otevři [`index.html`](index.html) v prohlížeči (stačí dvojklik). Nic víc není potřeba —
žádný server, žádné závislosti.

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
- otevřením samostatné stránky [`stats.html`](stats.html).

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
Pages), stará se o offline `sw.js` (service worker) se strategií **network first, cache jako
fallback**: když je síť dostupná, načte čerstvou verzi a uloží ji do cache; když síť/server
vypadne, obslouží poslední uloženou verzi z cache.

> Service worker funguje jen přes http(s) nebo `localhost` (ne přes `file://`). Vyzkoušet se
> dá lokálně: `python3 -m http.server` ve složce hry, otevřít `http://localhost:8000/`,
> načíst jednou online a pak v DevTools zapnout *Offline* (nebo vypnout server) — hra se
> načte dál. Po nasazení nové verze se cache sama aktualizuje při prvním online načtení.

## Velikonoční vajíčka

- **Výročí svatby** — od prvního výročí (rok po svatbě) se v den výročí v menu spustí
  ohňostroj a nápis „Šťastné X. výročí!". Datum se nastavuje v `index.html` konstantou
  `WEDDING = { year, month, day }`.

## Téma

- **Ženich** (vlevo) — šedý oblek, fialový motýlek, krátké tmavě blond vlasy, stojí u své sklenice.
- **Nevěsta** (vpravo) — klasické bílé šaty, tmavě blond vlasy po ramena, kytice, u své sklenice.
- Obě postavičky se houpou a vyskočí radostí, když se jim něco smaže.
- Po výhře: „PRÁVĚ SEZDÁNI!", oba spolu, létající srdíčka a koruna nad vítězem.

## Technické

Vše je v jediném souboru [`index.html`](index.html) — HTML, CSS i JavaScript (vanilla,
`<canvas>`). Žádné externí knihovny, žádné fonty z internetu, funguje i offline.
Vykreslování běží v PAL rozlišení 720×576 (vnitřní herní souřadnice 320×240 se škálují
nahoru), zobrazené v poměru 4:3 jako na staré televizi.
