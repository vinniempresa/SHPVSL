import { useEffect } from 'react';

/**
 * Hook que força o scroll para o topo da página quando o componente é montado
 * Implementação robusta para garantir funcionamento em todos os ambientes
 */
export function useScrollTop() {
  useEffect(() => {
    // Múltiplas tentativas para garantir que o scroll funcione
    const scrollToTop = () => {
      // Método 1: window.scrollTo com comportamento instant (mais garantido)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      
      // Método 2: Definir diretamente as propriedades scrollTop
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Método 3: Para elementos que podem ter overflow
      const scrollableElements = document.querySelectorAll('[data-scroll-container]');
      scrollableElements.forEach(element => {
        (element as HTMLElement).scrollTop = 0;
      });
    };

    // Executar imediatamente
    scrollToTop();
    
    // Executar novamente após um tick para garantir
    const timeoutId = setTimeout(scrollToTop, 0);
    
    // Executar mais uma vez após 10ms para casos de renderização lenta
    const timeoutId2 = setTimeout(scrollToTop, 10);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);
}