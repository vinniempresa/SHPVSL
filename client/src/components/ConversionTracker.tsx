import React, { useEffect } from 'react';
import { trackPurchase, initFacebookPixel } from '@/lib/facebook-pixel';
import { trackTikTokPurchase } from '@/lib/tiktok-pixel';

interface ConversionTrackerProps {
  transactionId: string;
  amount: number;
  enabled: boolean;
}

/**
 * Componente especializado para rastreamento de conversões que funciona
 * mesmo em ambientes com bloqueadores de anúncios ou cookies
 * Rastreia tanto Facebook Pixel quanto TikTok Pixel
 */
const ConversionTracker: React.FC<ConversionTrackerProps> = ({ 
  transactionId, 
  amount, 
  enabled 
}) => {
  useEffect(() => {
    if (!enabled) return;
    
    // Inicializar Facebook Pixel caso ainda não esteja inicializado
    initFacebookPixel();
    
    const trackConversion = async () => {
      console.log('[CONVERSION] Iniciando rastreamento robusto da conversão:', { transactionId, amount });
      
      // DESATIVADO: Para evitar conversões duplicadas
      // O trackPurchase já é chamado nas páginas principais
      console.log('[CONVERSION] ConversionTracker desativado para evitar duplicatas. Rastreamento feito via páginas principais.');
    };

    // Rastrear a conversão
    trackConversion();
    
    // DESATIVADO: retry para evitar conversões duplicadas
    // const retryTimeout = setTimeout(() => {
    //   console.log('[CONVERSION] Executando segunda tentativa de rastreamento');
    //   trackConversion();
    // }, 3000);
    
    return () => {
      // clearTimeout(retryTimeout);
    };
  }, [transactionId, amount, enabled]);

  // Não renderiza nada visualmente
  return null;
};

export default ConversionTracker;