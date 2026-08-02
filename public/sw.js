// Service worker pro Dr. Wedding — offline provoz.
// Strategie: cache first (stale-while-revalidate).
//   - je v cache: vrať ji OKAMŽITĚ a na pozadí si stáhni čerstvou verzi pro příště
//   - není v cache: jdi na síť a odpověď si ulož
// Proč ne network first: na kiosku (svatba) je síť to nejméně spolehlivé. Když WiFi
// *je*, ale je mrtvá, network first čeká na timeout u každého souboru → pomalý start.
// Cache first je okamžitý a na síti vůbec nezávisí; novou verzi si vyzvedne na pozadí.
// (Funguje jen při hostování přes http(s) nebo localhost, ne přes file://.)
const CACHE = 'dr-wedding-v19';
const ASSETS = ['./', 'index.html', 'stats.html', 'sounds.html', 'audio.ca465784.js', 'statsview.5ee1c382.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e=>{
  self.skipWaiting();                                  // nová verze SW se aktivuje hned
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=> Promise.all(keys.filter(k=> k!==CACHE).map(k=> caches.delete(k))))  // ukliď staré cache
      .then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;                     // POST apod. neřešíme
  e.respondWith((async ()=>{
    const cached = await caches.match(req);

    // stažení čerstvé verze — běží i když vracíme cache (aktualizace na pozadí)
    const fresh = fetch(req).then(resp=>{
      if(resp && resp.status===200 && resp.type==='basic'){
        const copy = resp.clone();
        caches.open(CACHE).then(c=> c.put(req, copy)).catch(()=>{});
      }
      return resp;
    }).catch(()=> null);                               // síť selhala → null (řeší se níž)

    if(cached){
      e.waitUntil(fresh);                              // drž SW naživu, než doběhne aktualizace
      return cached;                                   // ...ale odpověz hned z cache
    }
    const resp = await fresh;
    if(resp) return resp;
    // není v cache ani na síti: u navigace aspoň vrať herní stránku
    if(req.mode === 'navigate'){
      const fallback = await caches.match('index.html');
      if(fallback) return fallback;
    }
    return Response.error();
  })());
});
