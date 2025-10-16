import { useEffect } from 'react';

// Declaração de tipo para Microsoft Clarity
declare global {
  interface Window {
    clarity: any;
  }
}

/**
 * Componente que inicializa o Microsoft Clarity no carregamento da aplicação
 * Deve ser usado no App.tsx para garantir que o Clarity seja carregado globalmente
 */
export const ClarityInitializer: React.FC = () => {
  useEffect(() => {
    // Verificar se o script já foi carregado para evitar duplicação
    if (window.clarity) {
      console.log('[CLARITY] Microsoft Clarity já foi inicializado');
      return;
    }

    try {
      // Adicionar o script do Microsoft Clarity ao head
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "t30kvr18k5");
      `;
      
      document.head.appendChild(script);
      console.log('[CLARITY] Microsoft Clarity inicializado com sucesso');
    } catch (error) {
      console.error('[CLARITY] Erro ao inicializar Microsoft Clarity:', error);
    }
  }, []);

  return null; // Este componente não renderiza nada visualmente
};

export default ClarityInitializer;