# 💍 Dr. Wedding

Retro svatební hra ve stylu **Dr. Mario** — multiplayer pro dva hráče, ženich proti nevěstě.
Čistá webovka v jednom souboru, bez instalace a bez zvuků, stylizovaná do staré CRT televize 4:3.

## Spuštění

Otevři [`index.html`](index.html) v prohlížeči (stačí dvojklik). Nic víc není potřeba —
žádný server, žádné závislosti.

Pro nejlepší zážitek klikni na **⛶ FULLSCREEN** (nebo stiskni `F`).

## Jak se hraje

Padají dvoubarevné kapsle. Srovnej **4 a více stejných barev** vedle sebe (vodorovně
nebo svisle) a smažou se i s „starostmi" (svatební breberky). Kdo první vyčistí ze své
sklenice všechny starosti, **vyhrává**. Komba posílají soupeři do sklenice smetí navíc.

Barvy: 🟣 fialová · 🟡 zlatá (šampaňské) · 🩷 růžová.

### Ovládání

| Akce      | Ženich (vlevo) | Nevěsta (vpravo) |
|-----------|----------------|------------------|
| Doleva    | `A`            | `←`              |
| Doprava   | `D`            | `→`              |
| Otočit    | `W`            | `↑`              |
| Dolů      | `S`            | `↓`              |

V menu: nahoru/dolů (`W`/`S` nebo šipky, případně ovladač) přepíná mezi *dva hráči* a
*vs počítač* (na trénink sólo) · `Enter` = start · `F` = fullscreen.

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

## Téma

- **Ženich** (vlevo) — šedý oblek, fialový motýlek, krátké tmavě blond vlasy, stojí u své sklenice.
- **Nevěsta** (vpravo) — klasické bílé šaty, tmavě blond vlasy po ramena, kytice, u své sklenice.
- Obě postavičky se houpou a vyskočí radostí, když se jim něco smaže.
- Po výhře: „PRÁVĚ SEZDÁNI!", oba spolu, létající srdíčka a koruna nad vítězem.

## Technické

Vše je v jediném souboru [`index.html`](index.html) — HTML, CSS i JavaScript (vanilla,
`<canvas>`). Žádné externí knihovny, žádné fonty z internetu, funguje i offline.
Vykreslování je v nízkém rozlišení 320×240 škálovaném nahoru pro autentický pixelový retro vzhled.
