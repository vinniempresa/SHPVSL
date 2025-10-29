/**
 * Script de integração com Facebook Pixel
 * Pixel único: 680916878034680
 * SEM sistema anti-duplicata para garantir rastreamento de 100% das vendas
 */

const FACEBOOK_PIXEL_ID = '680916878034680';

/**
 * Inicializa o Facebook Pixel
 */
export function initFacebookPixel(): void {
  console.log('[FB-PIXEL] Inicializando Facebook Pixel 680916878034680');
  
  if (typeof window !== 'undefined' && !window.fbq) {
    const head = document.head || document.getElementsByTagName('head')[0];
    const pixelScript = document.createElement('script');
    pixelScript.type = 'text/javascript';
    
    pixelScript.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FACEBOOK_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    
    head.appendChild(pixelScript);

    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    head.appendChild(noscript);
    
    console.log(`[FB-PIXEL] Facebook Pixel ${FACEBOOK_PIXEL_ID} inicializado com sucesso.`);
  }
}

/**
 * Rastreia um evento do Facebook Pixel
 * @param eventName Nome do evento
 * @param eventData Dados do evento (opcional)
 */
export function trackEvent(eventName: string, eventData?: Record<string, any>): void {
  if (typeof window !== 'undefined') {
    if (!window.fbq) {
      initFacebookPixel();
      
      setTimeout(() => {
        if (window.fbq) {
          console.log(`[FB-PIXEL] Rastreando evento após inicialização: ${eventName}`, eventData || '');
          window.fbq('track', eventName, eventData);
        } else {
          console.warn('[FB-PIXEL] Falha ao inicializar o Facebook Pixel para rastrear evento.');
        }
      }, 500);
      return;
    }
    
    console.log(`[FB-PIXEL] Rastreando evento: ${eventName}`, eventData || '');
    window.fbq('track', eventName, eventData);
  } else {
    console.warn('[FB-PIXEL] Ambiente sem janela detectado, não é possível rastrear evento.');
  }
}

/**
 * Rastreia um evento de compra aprovada (SEM proteção contra duplicatas)
 * Agora rastreia TODAS as vendas para garantir 100% de cobertura
 * @param transactionId ID da transação
 * @param amount Valor da transação
 * @param currency Moeda (default: BRL)
 * @param itemName Nome do item
 */
export function trackPurchase(
  transactionId: string, 
  amount: number,
  currency: string = 'BRL',
  itemName: string = 'Kit de Segurança Shopee'
): void {
  console.log('[FB-PIXEL] Rastreando compra:', { transactionId, amount, currency });
  
  const eventData = {
    value: amount,
    currency: currency,
    content_name: itemName,
    content_type: 'product',
    content_ids: [transactionId],
    transaction_id: transactionId,
  };
  
  // Sempre enviar o evento de Purchase
  trackEvent('Purchase', eventData);
  
  console.log(`[FB-PIXEL] Evento Purchase enviado para transação ${transactionId}`);
}

/**
 * Verifica o status de um pagamento diretamente na API 4M Pagamentos
 */
export async function checkPaymentStatus(paymentId: string, apiKey: string): Promise<any> {
  try {
    console.log('[FB-PIXEL] Verificando status da transação:', paymentId);
    
    if (!apiKey) {
      console.error('[FB-PIXEL] API Key não disponível');
      return { success: false, error: 'API Key não disponível' };
    }
    
    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    const response = await fetch(`https://app.4mpagamentos.com/api/v1/transaction.getPayment?id=${paymentId}`, {
      method: 'GET',
      headers,
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[FB-PIXEL] Status do pagamento:', data);
    
    const approvedStatusList = ['APPROVED', 'approved', 'PAID', 'paid', 'COMPLETED', 'completed'];
    const isApproved = data && data.status && approvedStatusList.includes(data.status.toUpperCase());
    
    if (isApproved) {
      console.log('[FB-PIXEL] Pagamento APROVADO! Rastreando evento de conversão...');
      
      const amount = data.amount ? parseFloat(data.amount) / 100 : 64.97;
      trackPurchase(paymentId, amount);
      
      console.log('[FB-PIXEL] Evento de conversão enviado para Pixel:', FACEBOOK_PIXEL_ID);
      
      return { success: true, data, approved: true };
    }
    
    return { success: true, data, approved: false };
  } catch (error) {
    console.error('[FB-PIXEL] Erro ao verificar status:', error);
    return { success: false, error, approved: false };
  }
}

// Adicionar tipagem para o Facebook Pixel no window global
declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}
