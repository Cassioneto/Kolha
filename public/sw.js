// Kolha SW — app shell offline para a Tia (Unitel 500MB, rede falha).
// GET same-origin: cache-first com fallback offline. API de escrita (POST/DELETE)
// passa sempre à rede; se falhar, o app guarda em localStorage e sincroniza depois.
const VERSAO = 'kolha-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icone.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSAO)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {}),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => {}),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Só tratamos GET do nosso próprio domínio.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // API nunca entra em cache: dados de fretes/fila têm de vir sempre frescos.
  // (Offline, os GETs da API falham e o app mostra os estados vazios;
  // as escritas ficam em localStorage e sincronizam ao voltar a rede.)
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(VERSAO);
      const hit = await cache.match(req, { ignoreSearch: false });
      if (hit) return hit;
      try {
        const rede = await fetch(req);
        if (rede.ok) cache.put(req, rede.clone()).catch(() => {});
        return rede;
      } catch (falha) {
        const deNovo = await cache.match(req, { ignoreSearch: false });
        if (deNovo) return deNovo;
        // Navegação offline: volta ao início (que está em cache).
        if (req.mode === 'navigate') {
          const inicio = await cache.match('/');
          if (inicio) return inicio;
        }
        throw falha;
      }
    })(),
  );
});
