// Service Worker para PWA com Push Notifications
const CACHE_NAME = 'shopee-delivery-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/instalar-app',
  '/cadastro',
  '/treinamento',
  '/app',
  '/shopee-icon.jpg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando... v3');
  console.log('🌐 Location:', self.location.href);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto:', CACHE_NAME);
        console.log('📄 URLs para cache:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos os recursos foram cacheados');
      })
      .catch((error) => {
        console.error('❌ Erro ao fazer cache:', error);
      })
  );
  // Ativar imediatamente o novo Service Worker
  console.log('⏭️ Pulando waiting...');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Controlar imediatamente todas as páginas
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// ===== FORÇA INSTALAÇÃO PWA =====

// Escutar mensagens da página para forçar instalação
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem recebida no SW:', event.data);
  
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('🔥 Forçando atualização para ativar instalação...');
    
    // Tentar trigger do beforeinstallprompt via clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        console.log('📱 Enviando comando de instalação para client:', client.id);
        client.postMessage({
          type: 'TRIGGER_INSTALL_PROMPT',
          message: 'ServiceWorker está forçando o prompt de instalação'
        });
      });
    });
    
    // Forçar renovação do cache para satisfazer critérios PWA
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log('♻️ Renovando cache para satisfazer critérios PWA...');
        return cache.addAll(urlsToCache);
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Pulando waiting...');
    self.skipWaiting();
  }
});

// Interceptar instalação para forçar ativação imediata
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando (forçado)...');
  
  // Marcar como installable imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Cache criado, marcando como installable...');
      
      // Enviar sinal para todas as páginas abertas
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_INSTALLED', 
            message: 'ServiceWorker instalado, pode ser installable agora'
          });
        });
      });
      
      return cache.addAll(urlsToCache);
    })
  );
  
  // Ativar imediatamente
  self.skipWaiting();
});

// ===== PUSH NOTIFICATIONS =====

// Receber push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recebida:', event);
  
  let notificationData = {
    title: 'Entregas Shopee',
    body: 'Nova notificação!',
    icon: '/shopee-icon.jpg',
    badge: '/shopee-icon.jpg',
    data: {}
  };

  // Tentar parsear dados do push
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || 'shopee-notification',
        data: data.data || notificationData.data,
        actions: data.actions,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      };
    } catch (e) {
      console.error('❌ Erro ao parsear dados do push:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  console.log('📢 Exibindo notificação:', notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Clique em notificação - redireciona para treinamento
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada:', event.notification);
  
  // Fechar a notificação
  event.notification.close();
  
  // Determinar URL de destino baseado no tipo de notificação
  let targetUrl = '/app';
  
  if (event.notification.tag === 'shopee-training' || 
      event.notification.tag === 'shopee-urgent-training' ||
      event.notification.tag === 'shopee-training-welcome' ||
      event.notification.tag === 'shopee-training-reminder') {
    targetUrl = '/treinamento-app';
    console.log('🎓 Redirecionando para página de treinamento');
  }
  
  // Abrir ou focar na janela do app na página correta
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Se há uma janela aberta, focar nela e navegar
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          console.log('🔄 Focando janela existente e navegando para:', targetUrl);
          client.postMessage({ action: 'navigate', url: targetUrl });
          return client.focus();
        }
      }
      
      // Se não há janela aberta, abrir uma nova na URL correta
      if (self.clients.openWindow) {
        console.log('🆕 Abrindo nova janela em:', targetUrl);
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificação fechada:', event.notification);
  // Aqui podemos enviar analytics sobre notificações fechadas
});

// Message handling (para comunicação com a página)
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida no SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});