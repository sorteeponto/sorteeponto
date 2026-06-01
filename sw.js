// Cache version — mude este número a cada deploy para forçar atualização
const CACHE_VERSION = 'sorte-ponto-v' + Date.now();
const CACHE_NAME = CACHE_VERSION;
const FILES = ['./index.html', './manifest.json'];

// Instala e força atualização imediata
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(FILES))
  );
  self.skipWaiting(); // ativa imediatamente sem esperar fechar abas
});

// Remove caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // assume controle de todas as abas abertas
});

// Rede primeiro, cache como fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza cache com versão nova da rede
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // offline: usa cache
  );
});

// Notifica clientes quando nova versão está disponível
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
