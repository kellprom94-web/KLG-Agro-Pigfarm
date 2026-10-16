// Офлайн-кеш KLG Agro: застосунок відкривається без інтернету.
const CACHE = 'klg-agro-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './firebase-config.js',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const same = u.origin === location.origin;
  const lib = u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!same && !lib) return; // база даних і вхід ідуть напряму
  if (same) { // свій код: спершу мережа (щоб оновлення приходили одразу), без мережі — кеш
    e.respondWith(caches.open(CACHE).then(c => fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; })
      .catch(() => c.match(req, { ignoreSearch: true }).then(h => h || c.match('./index.html')))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: same });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
