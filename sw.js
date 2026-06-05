// Service Worker — limpa cache automaticamente quando index.html muda

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Para o index.html: sempre busca na rede primeiro
  if (e.request.url.includes('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(response => {
        // Verifica se a versão mudou
        response.clone().text().then(html => {
          var match = html.match(/app-version.*content="(\d+)"/);
          if (match) {
            var novaVersao = match[1];
            var versaoAtual = self.__versaoAtual || null;
            if (versaoAtual && versaoAtual !== novaVersao) {
              // Versão mudou — notifica todos os clientes para recarregar
              self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: 'NOVA_VERSAO' }));
              });
            }
            self.__versaoAtual = novaVersao;
          }
        });
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Para outros recursos: rede primeiro, cache como fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
