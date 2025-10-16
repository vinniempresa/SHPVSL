import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Download, Star, Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallApp: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Estados para controle da instalação
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Detectar se já está instalado como PWA
  useEffect(() => {
    const checkIfInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkIfInstalled();
    
    // Escutar mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkIfInstalled);
    
    return () => {
      mediaQuery.removeListener(checkIfInstalled);
    };
  }, []);

  // Android PWA: Escutar beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Evita mini-infobar automática
      setDeferredPrompt(e); // Guarda para usar no clique
      setIsInstallable(true); // Mostra que pode instalar
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    // Escutar eventos PWA
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openHowTo = () => {
    // Mostrar instruções manuais
    alert(
      '📱 COMO INSTALAR:\n\n' +
      '🤖 ANDROID:\n' +
      '• Toque nos 3 pontos ⋮ no menu do navegador\n' +
      '• "Instalar aplicativo" ou "Adicionar à tela inicial"\n\n' +
      '🍎 iOS:\n' +
      '• Toque no botão compartilhar 📤\n' +
      '• "Adicionar à Tela de Início"\n' +
      '• Confirme "Adicionar"'
    );
  };

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert('✅ App já está instalado!\n\nO Entregas Shopee já está na sua tela inicial.');
      return;
    }

    setIsInstalling(true);

    try {
      // Detectar plataforma
      const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      // Debug no console
      console.log('🔍 Detectando plataforma:', {
        userAgent: navigator.userAgent,
        isiOS,
        isAndroid,
        hasShare: 'share' in navigator,
        hasDeferredPrompt: !!deferredPrompt,
        isStandalone,
        isInstallable
      });

      // 1. ANDROID com beforeinstallprompt (Chrome/Edge) - PRIORIDADE MÁXIMA
      if (deferredPrompt && isAndroid) {
        try {
          console.log('🤖 ANDROID: Usando beforeinstallprompt nativo...');
          
          const result = await deferredPrompt.prompt(); // Abre prompt nativo
          const choice = await result.userChoice;
          
          console.log('👤 Escolha do usuário:', choice.outcome);
          
          if (choice.outcome === 'accepted') {
            console.log('✅ Usuário aceitou instalação Android');
            setIsStandalone(true);
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalling(false);
            alert('🎉 APP INSTALADO COM SUCESSO!\n\nO Entregas Shopee foi adicionado à sua tela inicial!');
            return;
          } else {
            console.log('❌ Usuário recusou instalação Android');
            setIsInstalling(false);
            return;
          }
        } catch (error) {
          console.error('❌ Erro no beforeinstallprompt:', error);
          setIsInstalling(false);
          openHowTo();
          return;
        }
      }

      // 2. iOS (Safari ou Chrome no iOS) com Share API
      if (isiOS && navigator.share) {
        try {
          console.log('🍎 iOS detectado com Share API - Abrindo share sheet...');
          
          // Abre o share sheet do iOS; "Adicionar à Tela de Início" fica lá dentro
          await navigator.share({ 
            title: 'Entregas Shopee',
            url: location.href 
          });
          
          // Aguardar um pouco e verificar se foi instalado
          setTimeout(() => {
            const nowStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            if (nowStandalone) {
              setIsStandalone(true);
              alert('🎉 APP INSTALADO COM SUCESSO!\n\nO Entregas Shopee agora está na sua tela inicial!');
            } else {
              // Mostrar dica sobre onde encontrar a opção
              alert(
                '📱 SHARE SHEET ABERTO!\n\n' +
                'Procure por:\n' +
                '• "Adicionar à Tela de Início"\n' +
                '• "Add to Home Screen"\n\n' +
                'Role para baixo se não encontrar imediatamente.'
              );
            }
            setIsInstalling(false);
          }, 2000);
          
        } catch (error) {
          console.log('Share API falhou:', error);
          setIsInstalling(false);
          openHowTo();
        }
      } else {
        // 3. Fallback: Instruções manuais para outros casos
        console.log('📖 Fallback: Mostrando instruções manuais');
        setIsInstalling(false);
        openHowTo();
      }

    } catch (error) {
      console.error('Erro na instalação:', error);
      setIsInstalling(false);
      openHowTo();
    }
  };

  // Avaliações fictícias para o tema Play Store
  const reviews = [
    {
      name: "Carlos Silva",
      rating: 5,
      text: "Estou faturando R$ 3.500/mês com as entregas! App perfeito e muito fácil de usar."
    },
    {
      name: "Maria Santos",
      rating: 5,
      text: "Em 2 meses já consegui comprar uma moto nova. As entregas da Shopee são muito boas!"
    },
    {
      name: "João Costa",
      rating: 5,
      text: "Renda extra garantida! Trabalho nas horas vagas e já pago todas as contas."
    },
    {
      name: "Ana Oliveira",
      rating: 5,
      text: "Melhor app de entrega que já usei. Suporte excelente e pagamento em dia."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Instalar Entregas Shopee - Download App</title>
        <meta name="description" content="Baixe o app Entregas Shopee e comece a faturar hoje mesmo fazendo entregas." />
        <style>{`
          .sora {
            font-family: 'Sora', sans-serif;
          }
        `}</style>
      </Helmet>
      
      {/* Container Principal */}
      <div className="bg-[#fafbfc] min-h-screen flex flex-col sora" style={{maxWidth:'430px',margin:'0 auto',boxShadow:'0 0 24px 0 rgba(0,0,0,0.08)',height:'100vh'}}>
        
        {/* Header igual ao /app */}
        <div className="bg-[#f55a1e] w-full h-[48px] fixed top-0 left-0 flex items-center justify-between px-4 z-30 sora" style={{maxWidth:'430px'}}>
          <div className="flex items-center">
            <div className="w-[36px] h-[36px] flex items-center justify-center">
              <img alt="Shopee logo icon, white bag with orange S on orange background" className="w-7 h-7" height="28" src="https://freelogopng.com/images/all_img/1656181355shopee-icon-white.png" width="28" />
            </div>
          </div>
          <div>
            <button 
              aria-label="Voltar" 
              className="relative focus:outline-none" 
              onClick={() => setLocation('/')}
            >
              <i className="fas fa-arrow-left text-white text-xl"></i>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 w-full pt-[48px] pb-4 sora overflow-y-auto" style={{maxWidth:'430px'}}>
          
          {/* Seção do App Info - Estilo Play Store */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex items-start gap-4">
              {/* Ícone do App */}
              <div className="flex-shrink-0">
                <img 
                  src="https://e3ba6e8732e83984.cdn.gocache.net/uploads/image/file/3108694/regular_86cdc6d5c3d9095ffab186cdad4b0c26.jfif" 
                  alt="Ícone do Entregas Shopee"
                  className="w-16 h-16 border border-gray-300"
                  style={{borderRadius: '0'}}
                />
              </div>
              
              {/* Info do App */}
              <div className="flex-1">
                <h1 className="text-xl font-bold sora" style={{color: '#000000cc'}}>Entregas Shopee</h1>
                <p className="text-sm sora" style={{color: '#00000066'}}>Shopee Brasil</p>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold sora">4.9</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="w-3 h-3 fill-[#f55a1e] text-[#f55a1e]" />
                    ))}
                  </div>
                  <span className="text-xs sora" style={{color: '#00000066'}}>(2.847)</span>
                </div>
                
                <div className="text-xs sora mt-1" style={{color: '#00000066'}}>
                  Grátis • Negócios
                </div>
              </div>
            </div>
            
            {/* Botão de Instalar - Estilo Play Store */}
            <div className="mt-4">
              <Button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full bg-[#f55a1e] hover:bg-[#d73919] text-white font-bold sora py-3 px-6 text-base"
                style={{borderRadius: '0'}}
              >
                {isInstalling ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Instalando...
                  </>
                ) : isStandalone ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Instalado
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Instalar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Informações da Versão */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="text-left">
              <div className="text-sm sora mb-2" style={{color: '#00000089'}}>
                Versão 3.57.60
              </div>
              <div className="text-sm sora leading-relaxed" style={{color: '#000000cc'}}>
                IMPORTANTE: O aplicativo oficial do entregador Shopee só pode ser baixado aqui neste site oficial. 
                Não baixe de outros lugares para sua segurança.
                Lembre-se de permitir as notificações quando solicitado e seguir o passo a passo de instalação abaixo.
              </div>
            </div>
          </div>

          {/* Banner da Shopee */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="w-full max-w-[300px] mx-auto">
              <img 
                src="https://www.tecnologistica.com.br/up/2024/09/26/shopee_entrega_re_1200.jpg" 
                alt="Banner Shopee Entregas"
                className="w-full h-32 object-cover border border-gray-200"
                style={{borderRadius: '0'}}
              />
            </div>
          </div>

          {/* Passo a Passo - Como Instalar no Android */}
          <div className="bg-white p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold sora mb-4" style={{color: '#000000cc'}}>Como instalar no Android</h2>
            
            <div className="space-y-4">
              {/* Passo 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#f55a1e] text-white text-xs font-bold flex items-center justify-center" style={{borderRadius: '50%'}}>
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium sora mb-1" style={{color: '#000000cc'}}>Toque no botão "Instalar"</div>
                  <div className="text-sm sora" style={{color: '#00000066'}}>O arquivo do app será baixado automaticamente</div>
                </div>
              </div>
              
              {/* Passo 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#f55a1e] text-white text-xs font-bold flex items-center justify-center" style={{borderRadius: '50%'}}>
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium sora mb-1" style={{color: '#000000cc'}}>Clique em "Instalar" na notificação</div>
                  <div className="text-sm sora" style={{color: '#00000066'}}>Aparecerá uma notificação para instalar o aplicativo</div>
                </div>
              </div>
              
              {/* Passo 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#f55a1e] text-white text-xs font-bold flex items-center justify-center" style={{borderRadius: '50%'}}>
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium sora mb-1" style={{color: '#000000cc'}}>Procure o app nos seus aplicativos</div>
                  <div className="text-sm sora mb-2" style={{color: '#00000066'}}>Encontre o app na gaveta de aplicativos:</div>
                  
                  {/* Visual do app */}
                  <div className="flex items-center gap-2 bg-gray-50 p-2" style={{borderRadius: '0'}}>
                    <img 
                      src="https://e3ba6e8732e83984.cdn.gocache.net/uploads/image/file/3108694/regular_86cdc6d5c3d9095ffab186cdad4b0c26.jfif" 
                      alt="Ícone Entregas Shopee"
                      className="w-8 h-8 border border-gray-300"
                      style={{borderRadius: '0'}}
                    />
                    <span className="text-sm font-medium sora" style={{color: '#000000cc'}}>Entregas Shopee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Avaliações */}
          <div className="bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold sora" style={{color: '#000000cc'}}>Avaliações e opiniões</h2>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold sora">4.9</span>
                <Star className="w-5 h-5 fill-[#f55a1e] text-[#f55a1e]" />
              </div>
            </div>
            
            {/* Rating Summary */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 mb-4" style={{borderRadius: '0'}}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-5 h-5 fill-[#f55a1e] text-[#f55a1e]" />
                  ))}
                </div>
                <span className="text-lg font-bold sora" style={{color: '#000000cc'}}>4.9</span>
              </div>
              <div className="text-center">
                <span className="text-sm sora" style={{color: '#00000066'}}>2.847 avaliações • 95% recomendam</span>
              </div>
            </div>

            {/* Lista de Avaliações Melhorada */}
            <div className="space-y-3">
              {reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 p-3 border-l-4 border-[#f55a1e]" style={{borderRadius: '0'}}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#f55a1e] to-[#d73919] text-white text-sm font-bold flex items-center justify-center" style={{borderRadius: '50%'}}>
                      {review.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium sora" style={{color: '#000000cc'}}>{review.name}</div>
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className="w-3 h-3 fill-[#f55a1e] text-[#f55a1e]" />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs sora" style={{color: '#00000066'}}>Entregador verificado</div>
                    </div>
                  </div>
                  <p className="text-sm sora leading-relaxed" style={{color: '#000000cc'}}>"{review.text}"</p>
                  <div className="flex items-center gap-4 mt-2 text-xs sora" style={{color: '#00000066'}}>
                    <span>👍 Útil</span>
                    <span>📅 Há 2 dias</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Ver mais avaliações */}
            <div className="text-center mt-4">
              <button className="text-[#f55a1e] font-medium sora text-sm">
                Ver todas as 2.847 avaliações →
              </button>
            </div>
          </div>

          {/* Seção Sobre este app */}
          <div className="bg-white p-4 border-t border-gray-200">
            <h3 className="text-lg font-bold sora mb-3" style={{color: '#000000cc'}}>Sobre este app</h3>
            <p className="text-sm sora mb-4" style={{color: '#000000cc'}}>
              Entregas Shopee é o aplicativo oficial para entregadores parceiros da Shopee no Brasil. 
              Faça entregas e aumente sua renda de forma flexível e segura.
            </p>
            
            {/* Recursos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f55a1e]" />
                <span className="text-sm sora" style={{color: '#000000cc'}}>Renda extra garantida</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f55a1e]" />
                <span className="text-sm sora" style={{color: '#000000cc'}}>Horários flexíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f55a1e]" />
                <span className="text-sm sora" style={{color: '#000000cc'}}>Pagamento semanal</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f55a1e]" />
                <span className="text-sm sora" style={{color: '#000000cc'}}>Suporte 24/7</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default InstallApp;