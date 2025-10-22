import { useEffect } from 'react';
import { initKwaiPixel } from '@/lib/kwai-pixel';

/**
 * Componente que inicializa o Kwai Pixel no carregamento da aplicação
 * Deve ser usado no App.tsx para garantir que o pixel seja carregado globalmente
 */
export const KwaiPixelInitializer: React.FC = () => {
  useEffect(() => {
    // Inicializar o Kwai Pixel uma vez quando o aplicativo é carregado
    initKwaiPixel();
    console.log('[KWAI-PIXEL] Inicializado globalmente via componente KwaiPixelInitializer');
  }, []);

  return null; // Este componente não renderiza nada visualmente
};

export default KwaiPixelInitializer;
