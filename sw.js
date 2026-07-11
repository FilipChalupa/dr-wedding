// Service worker pro Dr. Wedding — offline provoz.
// Strategie: network first, cache jako fallback.
//   - online: vždy zkus síť, čerstvou odpověď ulož do cache a vrať ji
//   - offline / síť selže: vrať poslední uloženou verzi z cache
// (Funguje jen při hostování přes http(s) nebo localhost, ne přes file://.)
const CACHE = 'dr-wedding-v3';
const ASSETS = ['./', 'index.html', 'stats.html', 'sounds.html', 'audio.js', 'manifest.webmanifest', 'icon.svg'];

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
  e.respondWith(
    fetch(req)
      .then(resp=>{
        // čerstvou (úspěšnou, vlastní) odpověď ulož do cache pro příští offline
        if(resp && resp.status===200 && resp.type==='basic'){
          const copy = resp.clone();
          caches.open(CACHE).then(c=> c.put(req, copy));
        }
        return resp;
      })
      .catch(()=>                                       // síť selhala → fallback z cache
        caches.match(req).then(cached=>
          cached || (req.mode==='navigate' ? caches.match('index.html') : Response.error())
        )
      )
  );
});
