/**
 * Script de integração com TikTok Pixel
 * Implementação para rastreamento de conversões em todas as páginas
 */

// Obter TikTok Pixel IDs das variáveis de ambiente
const TIKTOK_PIXEL_IDS = (() => {
  const ids: string[] = [];
  
  // Suporta múltiplos pixels através de variáveis de ambiente
  if (import.meta.env.VITE_TIKTOK_PIXEL_ID) {
    ids.push(import.meta.env.VITE_TIKTOK_PIXEL_ID);
  }
  if (import.meta.env.VITE_TIKTOK_PIXEL_ID_2) {
    ids.push(import.meta.env.VITE_TIKTOK_PIXEL_ID_2);
  }
  if (import.meta.env.VITE_TIKTOK_PIXEL_ID_3) {
    ids.push(import.meta.env.VITE_TIKTOK_PIXEL_ID_3);
  }
  
  return ids;
})();

/**
 * Inicializa o TikTok Pixel
 */
export function initTikTokPixel(): void {
  if (TIKTOK_PIXEL_IDS.length === 0) {
    console.warn('[TIKTOK-PIXEL] Nenhum Pixel ID configurado. Configure VITE_TIKTOK_PIXEL_ID nas variáveis de ambiente.');
    return;
  }

  console.log('[TIKTOK-PIXEL] Inicializando TikTok Pixels');
  
  // Adicionar o script do TikTok Pixel à página
  if (typeof window !== 'undefined' && !window.ttq) {
    const head = document.head || document.getElementsByTagName('head')[0];
    const pixelScript = document.createElement('script');
    pixelScript.type = 'text/javascript';
    
    // Criar o código base do TikTok Pixel
    pixelScript.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      }(window, document, 'ttq');
    `;
    
    head.appendChild(pixelScript);
    
    // Inicializar cada Pixel ID
    TIKTOK_PIXEL_IDS.forEach(pixelId => {
      const initScript = document.createElement('script');
      initScript.type = 'text/javascript';
      initScript.innerHTML = `
        ttq.load('${pixelId}');
        ttq.page();
      `;
      head.appendChild(initScript);
    });
    
    console.log(`[TIKTOK-PIXEL] ${TIKTOK_PIXEL_IDS.length} TikTok Pixels inicializados com sucesso.`);
  }
}

/**
 * Rastreia um evento do TikTok Pixel em todos os pixels configurados
 * @param eventName Nome do evento
 * @param eventData Dados do evento (opcional)
 */
export function trackTikTokEvent(eventName: string, eventData?: Record<string, any>): void {
  if (TIKTOK_PIXEL_IDS.length === 0) {
    console.warn('[TIKTOK-PIXEL] Nenhum Pixel ID configurado. Evento não será rastreado.');
    return;
  }

  if (typeof window !== 'undefined') {
    // Inicializar o Pixel se ainda não estiver inicializado
    if (!window.ttq) {
      initTikTokPixel();
      
      // Aguardar a inicialização do pixel
      setTimeout(() => {
        if (window.ttq) {
          console.log(`[TIKTOK-PIXEL] Rastreando evento após inicialização: ${eventName}`, eventData || '');
          
          // Rastrear em todos os pixels configurados
          window.ttq.track(eventName, eventData);
          
          // Rastrear em pixels adicionais usando instance
          TIKTOK_PIXEL_IDS.slice(1).forEach(pixelId => {
            window.ttq.instance(pixelId).track(eventName, eventData);
          });
        } else {
          console.warn('[TIKTOK-PIXEL] Falha ao inicializar o TikTok Pixel para rastrear evento.');
        }
      }, 500);
      return;
    }
    
    console.log(`[TIKTOK-PIXEL] Rastreando evento: ${eventName} em ${TIKTOK_PIXEL_IDS.length} pixel(s)`, eventData || '');
    
    // Rastrear no pixel principal
    window.ttq.track(eventName, eventData);
    
    // Rastrear em pixels adicionais usando instance
    TIKTOK_PIXEL_IDS.slice(1).forEach(pixelId => {
      window.ttq.instance(pixelId).track(eventName, eventData);
    });
  } else {
    console.warn('[TIKTOK-PIXEL] Ambiente sem janela detectado, não é possível rastrear evento.');
  }
}

/**
 * Rastreia um evento de compra aprovada (com proteção contra duplicatas)
 * @param transactionId ID da transação
 * @param amount Valor da transação
 * @param currency Moeda (default: BRL)
 * @param itemName Nome do item
 */
export function trackTikTokPurchase(
  transactionId: string, 
  amount: number,
  currency: string = 'BRL',
  itemName: string = 'Kit de Segurança Shopee'
): boolean {
  if (TIKTOK_PIXEL_IDS.length === 0) {
    console.warn('[TIKTOK-PIXEL] Nenhum Pixel ID configurado. Purchase não será rastreado.');
    return false;
  }

  // Verificar se esta conversão já foi rastreada
  const conversionKey = `tiktok_conversion_${transactionId}`;
  const alreadyTracked = localStorage.getItem(conversionKey);
  
  if (alreadyTracked) {
    console.log(`[TIKTOK-PIXEL] Conversão ${transactionId} já foi rastreada anteriormente. Ignorando duplicata.`);
    return false;
  }
  
  console.log('[TIKTOK-PIXEL] Rastreando compra aprovada:', { transactionId, amount });
  
  const eventData = {
    value: amount,
    currency: currency,
    content_name: itemName,
    content_type: 'product',
    content_id: transactionId,
    contents: [{
      content_id: transactionId,
      content_name: itemName,
      quantity: 1,
      price: amount
    }]
  };
  
  // Enviar evento de conversão
  trackTikTokEvent('CompletePayment', eventData);
  
  // Marcar esta conversão como já rastreada
  localStorage.setItem(conversionKey, new Date().toISOString());
  
  console.log(`[TIKTOK-PIXEL] Conversão ${transactionId} rastreada e marcada como processada`);
  return true;
}

/**
 * Rastreia um evento de PageView
 */
export function trackTikTokPageView(): void {
  if (TIKTOK_PIXEL_IDS.length === 0) {
    return;
  }

  if (typeof window !== 'undefined' && window.ttq) {
    console.log('[TIKTOK-PIXEL] Rastreando PageView');
    window.ttq.page();
  }
}

// Adicionar tipagem para o TikTok Pixel no window global
declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: string;
  }
}
