/**
 * Script de integração com Kwai Pixel
 * Implementação para rastreamento de conversões em todas as páginas
 */

// Obter Kwai Pixel IDs das variáveis de ambiente
const KWAI_PIXEL_IDS = (() => {
  const ids: string[] = [];
  
  // Suporta múltiplos pixels através de variáveis de ambiente
  if (import.meta.env.VITE_KWAI_PIXEL_ID) {
    ids.push(import.meta.env.VITE_KWAI_PIXEL_ID);
  }
  if (import.meta.env.VITE_KWAI_PIXEL_ID_2) {
    ids.push(import.meta.env.VITE_KWAI_PIXEL_ID_2);
  }
  if (import.meta.env.VITE_KWAI_PIXEL_ID_3) {
    ids.push(import.meta.env.VITE_KWAI_PIXEL_ID_3);
  }
  
  return ids;
})();

/**
 * Inicializa o Kwai Pixel
 */
export function initKwaiPixel(): void {
  if (KWAI_PIXEL_IDS.length === 0) {
    console.warn('[KWAI-PIXEL] Nenhum Pixel ID configurado. Configure VITE_KWAI_PIXEL_ID nas variáveis de ambiente.');
    return;
  }

  console.log('[KWAI-PIXEL] Inicializando Kwai Pixels');
  
  // Adicionar o script do Kwai Pixel à página
  if (typeof window !== 'undefined' && !window.kwaiq) {
    const head = document.head || document.getElementsByTagName('head')[0];
    
    // Script principal do Kwai (minificado)
    const mainScript = document.createElement('script');
    mainScript.type = 'text/javascript';
    mainScript.innerHTML = `!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.install=t():e.install=t()}("undefined"!=typeof window?window:self,(function(){return function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";n.r(t),n.d(t,"load",(function(){return s})),n.d(t,"page",(function(){return c})),n.d(t,"track",(function(){return l}));var o="https://s1.kwai.net/kos/nlav10104/pixel/events.js",r=[];function i(e){r.forEach((function(t){return t(e)}))}function a(){return window.kwaiq}function u(){return{q:[],onLoadQ:r,load:s,page:c,track:l,on:function(e,t){r.push(t)}}}function s(e){!function(){if(!a()){var e=u();window.kwaiq=e,window.kwaiq.l=+new Date;var t=document.createElement("script"),n=document.getElementsByTagName("script")[0];t.async=1,t.src=o,n.parentNode.insertBefore(t,n),t.addEventListener("load",(function(){i("load")}))}}(),a().q.push({method:"load",args:Array.prototype.slice.call(arguments),t:+new Date})}function c(){a().q.push({method:"page",args:Array.prototype.slice.call(arguments),t:+new Date})}function l(){a().q.push({method:"track",args:Array.prototype.slice.call(arguments),t:+new Date})}}]).default}));`;
    head.appendChild(mainScript);
    
    // Inicializar cada Pixel ID
    KWAI_PIXEL_IDS.forEach(pixelId => {
      const initScript = document.createElement('script');
      initScript.type = 'text/javascript';
      initScript.innerHTML = `
        kwaiq.load('${pixelId}');
        kwaiq.page();
      `;
      head.appendChild(initScript);
    });
    
    console.log(`[KWAI-PIXEL] ${KWAI_PIXEL_IDS.length} Kwai Pixels inicializados com sucesso.`);
  }
}

/**
 * Rastreia um evento do Kwai Pixel em todos os pixels configurados
 * @param eventName Nome do evento
 * @param eventData Dados do evento (opcional)
 */
export function trackKwaiEvent(eventName: string, eventData?: Record<string, any>): void {
  if (KWAI_PIXEL_IDS.length === 0) {
    console.warn('[KWAI-PIXEL] Nenhum Pixel ID configurado. Evento não será rastreado.');
    return;
  }

  if (typeof window !== 'undefined') {
    // Inicializar o Pixel se ainda não estiver inicializado
    if (!window.kwaiq) {
      initKwaiPixel();
      
      // Aguardar a inicialização do pixel
      setTimeout(() => {
        if (window.kwaiq) {
          console.log(`[KWAI-PIXEL] Rastreando evento após inicialização: ${eventName}`, eventData || '');
          window.kwaiq.track(eventName, eventData);
        } else {
          console.warn('[KWAI-PIXEL] Falha ao inicializar o Kwai Pixel para rastrear evento.');
        }
      }, 500);
      return;
    }
    
    console.log(`[KWAI-PIXEL] Rastreando evento: ${eventName} em ${KWAI_PIXEL_IDS.length} pixel(s)`, eventData || '');
    window.kwaiq.track(eventName, eventData);
  } else {
    console.warn('[KWAI-PIXEL] Ambiente sem janela detectado, não é possível rastrear evento.');
  }
}

/**
 * Rastreia um evento de compra aprovada (com proteção contra duplicatas)
 * @param transactionId ID da transação
 * @param amount Valor da transação
 * @param currency Moeda (default: BRL)
 * @param itemName Nome do item
 */
export function trackKwaiPurchase(
  transactionId: string, 
  amount: number,
  currency: string = 'BRL',
  itemName: string = 'Kit de Segurança Shopee'
): boolean {
  if (KWAI_PIXEL_IDS.length === 0) {
    console.warn('[KWAI-PIXEL] Nenhum Pixel ID configurado. Purchase não será rastreado.');
    return false;
  }

  // Verificar se esta conversão já foi rastreada
  const conversionKey = `kwai_conversion_${transactionId}`;
  const alreadyTracked = localStorage.getItem(conversionKey);
  
  if (alreadyTracked) {
    console.log(`[KWAI-PIXEL] Conversão ${transactionId} já foi rastreada anteriormente. Ignorando duplicata.`);
    return false;
  }
  
  console.log('[KWAI-PIXEL] Rastreando compra aprovada:', { transactionId, amount });
  
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
  trackKwaiEvent('Purchase', eventData);
  
  // Marcar esta conversão como já rastreada
  localStorage.setItem(conversionKey, new Date().toISOString());
  
  console.log(`[KWAI-PIXEL] Conversão ${transactionId} rastreada e marcada como processada`);
  return true;
}

/**
 * Rastreia um evento de PageView
 */
export function trackKwaiPageView(): void {
  if (KWAI_PIXEL_IDS.length === 0) {
    return;
  }

  if (typeof window !== 'undefined' && window.kwaiq) {
    console.log('[KWAI-PIXEL] Rastreando PageView');
    window.kwaiq.page();
  }
}

// Adicionar tipagem para o Kwai Pixel no window global
declare global {
  interface Window {
    kwaiq: any;
  }
}
