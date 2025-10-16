import { useEffect } from 'react';
import { initTikTokPixel } from '@/lib/tiktok-pixel';

/**
 * Componente que inicializa o TikTok Pixel no carregamento da aplicação
 * Deve ser usado no App.tsx para garantir que o pixel seja carregado globalmente
 */
export const TikTokPixelInitializer: React.FC = () => {
  useEffect(() => {
    // Inicializar o TikTok Pixel uma vez quando o aplicativo é carregado
    initTikTokPixel();
    console.log('[TIKTOK-PIXEL] Inicializado globalmente via componente TikTokPixelInitializer');
  }, []);

  return null; // Este componente não renderiza nada visualmente
};

export default TikTokPixelInitializer;
