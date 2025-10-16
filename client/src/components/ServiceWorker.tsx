import { useEffect } from 'react';

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    console.log('🔧 Iniciando registro do Service Worker...');
    console.log('🌐 Hostname:', window.location.hostname);
    console.log('🔒 Protocol:', window.location.protocol);
    console.log('🔧 ServiceWorker supported:', 'serviceWorker' in navigator);
    
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          console.log('📝 Registrando Service Worker em /sw.js...');
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('✅ Service Worker registrado com sucesso:', registration);
          console.log('📍 Scope:', registration.scope);
          console.log('🔄 Installing:', registration.installing);
          console.log('⏳ Waiting:', registration.waiting);
          console.log('🟢 Active:', registration.active);
          
          // Escutar mudanças no Service Worker
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Atualização do Service Worker encontrada');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('🔄 State do SW mudou para:', newWorker.state);
              });
            }
          });
          
        } catch (registrationError) {
          console.error('❌ Falha no registro do Service Worker:', registrationError);
          console.error('❌ Error details:', registrationError.message);
        }
      };
      
      // Registrar quando a página carregar
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    } else {
      console.log('❌ Service Worker não suportado neste navegador');
    }
  }, []);

  return null;
};

export default ServiceWorkerRegistration;