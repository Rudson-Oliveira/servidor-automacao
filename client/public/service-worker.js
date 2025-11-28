// Service Worker para PWA - Servidor de Automação
// Versão: 1.0.0

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `servidor-automacao-${CACHE_VERSION}`;

// Assets estáticos para cache (Cache First)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/cl-logo.svg',
];

// Estratégia de cache para diferentes tipos de requisição
const CACHE_STRATEGIES = {
  // Cache First: Assets estáticos (JS, CSS, imagens)
  CACHE_FIRST: 'cache-first',
  // Network First: APIs e dados dinâmicos
  NETWORK_FIRST: 'network-first',
  // Network Only: Autenticação e operações críticas
  NETWORK_ONLY: 'network-only',
};

// Tempo máximo de espera pela rede (Network First)
const NETWORK_TIMEOUT = 3000; // 3 segundos

// ========================================
// INSTALAÇÃO DO SERVICE WORKER
// ========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando assets estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets estáticos em cache!');
        // Força ativação imediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear assets:', error);
      })
  );
});

// ========================================
// ATIVAÇÃO DO SERVICE WORKER
// ========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Remove caches antigos
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('servidor-automacao-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado!');
        // Toma controle imediato de todas as páginas
        return self.clients.claim();
      })
  );
});

// ========================================
// INTERCEPTAÇÃO DE REQUISIÇÕES
// ========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de outros domínios (exceto APIs conhecidas)
  if (url.origin !== location.origin) {
    return;
  }

  // Determina estratégia baseada no tipo de requisição
  const strategy = getStrategy(url, request);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request));
      break;
    case CACHE_STRATEGIES.NETWORK_ONLY:
      // Não cacheia, apenas busca da rede
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// ========================================
// ESTRATÉGIAS DE CACHE
// ========================================

/**
 * Cache First: Busca no cache primeiro, se não encontrar busca na rede
 * Ideal para: Assets estáticos (JS, CSS, imagens, fontes)
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache HIT:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Cache MISS, buscando na rede:', request.url);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cacheia a resposta para próximas requisições
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Erro ao buscar da rede:', error);
    
    // Retorna página offline se disponível
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Retorna resposta de erro
    return new Response('Offline - Sem conexão com a internet', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

/**
 * Network First: Busca na rede primeiro, se falhar busca no cache
 * Ideal para: APIs, dados dinâmicos, tRPC calls
 */
async function networkFirst(request) {
  try {
    // Tenta buscar da rede com timeout
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cacheia a resposta para uso offline
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Rede falhou, buscando no cache:', request.url);
    
    // Se rede falhar, busca no cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache HIT (fallback):', request.url);
      return cachedResponse;
    }
    
    console.error('[SW] Não encontrado nem na rede nem no cache:', request.url);
    
    // Retorna erro
    return new Response('Offline - Dados não disponíveis', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

/**
 * Fetch com timeout
 */
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    ),
  ]);
}

/**
 * Determina estratégia de cache baseada na URL
 */
function getStrategy(url, request) {
  const pathname = url.pathname;

  // Assets estáticos: Cache First
  if (
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/) ||
    pathname === '/' ||
    pathname === '/index.html'
  ) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // APIs tRPC: Network First
  if (pathname.startsWith('/api/trpc')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Autenticação: Network Only (nunca cacheia)
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/oauth')) {
    return CACHE_STRATEGIES.NETWORK_ONLY;
  }

  // Outras APIs: Network First
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Default: Network First
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// ========================================
// MENSAGENS DO CLIENTE
// ========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Recebido SKIP_WAITING, atualizando...');
    self.skipWaiting();
  }
});

// ========================================
// WEB PUSH NOTIFICATIONS
// ========================================

/**
 * Listener para eventos de push
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  let notificationData = {
    title: 'Notificação',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: { url: '/' },
  };

  // Parse dos dados se disponíveis
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.error('[SW] Erro ao parsear dados do push:', error);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: notificationData.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-open.png',
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-close.png',
      },
    ],
    tag: notificationData.data?.type || 'default',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

/**
 * Listener para cliques em notificações
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);

  event.notification.close();

  // Se ação for "close", apenas fecha
  if (event.action === 'close') {
    return;
  }

  // Determina URL para abrir
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Procura por janela já aberta
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não encontrou, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service Worker carregado!', CACHE_VERSION);
