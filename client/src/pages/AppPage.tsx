import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import AppLogin from '@/components/AppLogin';

export default function AppPage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  
  // State para controlar se o usuário já fez login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCpf, setUserCpf] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const showPage = (page: string) => {
    setCurrentPage(page);
  };

  const goBackToHome = () => {
    setCurrentPage('home');
  };

  // Função para registrar push notifications
  const registerPushNotifications = async (user: any) => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Verificar se já tem subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (!existingSubscription) {
          // Criar nova subscription (usando VAPID key correta)
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BBAAnkFyzcnnfWoQ9DqjiY9QkQSFvScy9P_yi5LstVHcu01ja4rkYi_4ax50cZ24TTa_4aebogbVLur0NSEWHNo'
          });
          
          // Enviar subscription para o servidor
          const p256dhKey = subscription.getKey('p256dh');
          const authKey = subscription.getKey('auth');
          
          await fetch('/api/push-subscriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
                auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : ''
              },
              userId: user.id,
              userAgent: navigator.userAgent
            }),
          });
          
          console.log('✅ Push notifications registradas para:', user.name);
        } else {
          console.log('✅ Push notifications já ativas para:', user.name);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao registrar push notifications:', error);
    }
  };

  const handleLogin = (cpf: string) => {
    setUserCpf(cpf);
    setIsLoggedIn(true);
    
    // Salvar CPF na sessão
    localStorage.setItem('userCpf', cpf);
    
    // Carregar dados do usuário do localStorage
    const storedUser = localStorage.getItem('appUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        console.log('✅ Dados do usuario carregados:', user);
        
        // Registrar push notifications automaticamente
        registerPushNotifications(user);
        
      } catch (error) {
        console.error('Erro ao carregar dados do usuario:', error);
      }
    }
    
    console.log('✅ Usuario logado com CPF:', cpf);
  };

  // Função para logout
  const handleLogout = () => {
    // Limpar localStorage
    localStorage.removeItem('appUser');
    localStorage.removeItem('userCpf');
    
    // Resetar estados
    setIsLoggedIn(false);
    setUserData(null);
    setUserCpf('');
    setCurrentPage('home');
    
    console.log('🚪 Logout realizado - sessão limpa');
  };

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalVisible(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalVisible(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalVisible && e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalVisible]);

  useEffect(() => {
    // Aplicar estilos ao body quando o componente montar
    document.body.className = 'bg-[#fafbfc] min-h-screen flex flex-col justify-between sora relative';
    document.body.style.maxWidth = '430px';
    document.body.style.margin = '0 auto';
    document.body.style.boxShadow = '0 0 24px 0 rgba(0,0,0,0.08)';
    document.body.style.height = '100vh';
    
    // Verificar se há parâmetro de página na URL
    const urlParams = new URLSearchParams(window.location.search);
    const targetPage = urlParams.get('page');
    if (targetPage && ['entregas', 'saldo', 'historia', 'ajuda', 'perfil'].includes(targetPage)) {
      setCurrentPage(targetPage);
    }
    
    // Verificar sessão salva no localStorage
    const checkSavedSession = () => {
      const storedUser = localStorage.getItem('appUser');
      const storedCpf = localStorage.getItem('userCpf');
      
      if (storedUser && storedCpf) {
        try {
          const user = JSON.parse(storedUser);
          console.log('🔄 Sessão encontrada, fazendo login automático:', user.name);
          
          setUserData(user);
          setUserCpf(storedCpf);
          setIsLoggedIn(true);
          
          // Registrar push notifications automaticamente para usuário logado
          registerPushNotifications(user);
          
        } catch (error) {
          console.error('❌ Erro ao restaurar sessão:', error);
          // Limpar dados corrompidos
          localStorage.removeItem('appUser');
          localStorage.removeItem('userCpf');
        }
      }
    };
    
    // Carregamento inicial rápido do app (PWA) - reduzido para 800ms
    const timer = setTimeout(() => {
      checkSavedSession();
      setIsLoading(false);
    }, 800);
    
    return () => {
      // Limpar timer e estilos quando o componente desmontar
      clearTimeout(timer);
      document.body.className = '';
      document.body.style.maxWidth = '';
      document.body.style.margin = '';
      document.body.style.boxShadow = '';
      document.body.style.height = '';
    };
  }, []);

  // Exibir tela de loading para PWA
  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Entregas Shopee</title>
          <meta name="viewport" content="width=375, initial-scale=1" />
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
          <style>{`
            body, .sora {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            }
            body {
              background: #f55a1e !important;
            }
          `}</style>
        </Helmet>
        <div className="min-h-screen bg-[#f55a1e] flex flex-col items-center justify-center relative" style={{maxWidth:'430px', margin: '0 auto'}}>
          {/* Logo Shopee */}
          <div className="mb-12">
            <img 
              src="https://freelogopng.com/images/all_img/1656181355shopee-icon-white.png" 
              alt="Shopee" 
              className="w-20 h-20 object-contain"
            />
          </div>
          
          {/* Loader animado */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </>
    );
  }

  // Se não está logado, mostrar tela de login
  if (!isLoggedIn) {
    return <AppLogin onLogin={handleLogin} />;
  }

  return (
    <>
      <Helmet>
        <title>Entregas Shopee</title>
        <meta name="viewport" content="width=375, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
        <style>{`
          body, .sora {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          }
          .btn-treinamento:focus-visible {
            outline: 2px solid #f55a1e;
            outline-offset: 2px;
          }
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          html, body {
            background: #fafbfc;
            overscroll-behavior-y: none;
            min-height: 100vh;
            height: 100%;
          }
          @media (max-width: 430px) {
            body {
              padding-bottom: env(safe-area-inset-bottom);
              padding-top: env(safe-area-inset-top);
            }
          }
          .modal-bg {
            background: rgba(0,0,0,0.25);
            backdrop-filter: blur(2px);
          }
          /* Força todas as bordas arredondadas para 8px */
          .rounded-2xl, .rounded-xl, .rounded-lg, .rounded-t-2xl, .rounded-b-2xl, .rounded, .rounded-t-lg, .rounded-b-lg, .rounded-t, .rounded-b, .rounded-md, .rounded-sm {
            border-radius: 4px !important;
          }
          .btn-treinamento img, .btn-treinamento .rounded-t-2xl {
            border-radius: 4px 4px 0 0 !important;
          }
          .btn-treinamento {
            border-radius: 4px 4px 0 0 !important;
          }
          /* Custom 2px border radius for specific elements */
          .rounded-0 {
            border-radius: 2px !important;
          }
          /* Efeito 3D suave para ícones */
          .icon-3d {
            text-shadow: 
              0px 1px 1px rgba(255,255,255,0.8),
              1px 1px 2px rgba(0,0,0,0.1);
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
            transform: translateY(-0.5px);
            transition: all 0.15s ease;
          }
          .icon-3d:hover {
            transform: translateY(-1px) scale(1.05);
            text-shadow: 
              0px 1px 2px rgba(255,255,255,0.9),
              1px 2px 3px rgba(0,0,0,0.12);
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
          }
        `}</style>
      </Helmet>
      <div className="bg-[#fafbfc] min-h-screen flex flex-col justify-between sora relative" style={{maxWidth:'430px',margin:'0 auto',boxShadow:'0 0 24px 0 rgba(0,0,0,0.08)',height:'100vh'}}>
        {/* Header */}
        <div className="bg-[#f55a1e] w-full h-[48px] fixed top-0 left-0 flex items-center justify-between px-4 z-30 sora" style={{maxWidth:'430px'}}>
          <div className="flex items-center">
            <div className="w-[36px] h-[36px] flex items-center justify-center">
              <img alt="Shopee logo icon, white bag with orange S on orange background" className="w-7 h-7" height="28" src="https://freelogopng.com/images/all_img/1656181355shopee-icon-white.png" width="28" />
            </div>
          </div>
          <div>
            <button aria-label="Abrir notificações" className="relative focus:outline-none" onClick={openModal}>
              <i className="fas fa-bell text-white text-xl icon-3d"></i>
              <span className="absolute -top-1 -right-1 bg-white text-[#f55a1e] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-[#f55a1e]" style={{padding:0}}>
                1
              </span>
            </button>
          </div>
        </div>

        {/* Modal Notificações */}
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isModalVisible ? '' : 'hidden'}`}>
          <div className="modal-bg absolute inset-0" onClick={closeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-[92%] max-w-[370px] mx-auto p-0 overflow-hidden z-10 border border-[#f3f4f6]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#f55a1e] rounded-t-2xl">
              <span className="text-white text-lg font-bold sora">Notificações</span>
              <button aria-label="Fechar notificações" className="text-white text-2xl focus:outline-none" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
                  <i aria-hidden="true" className="fas fa-exclamation-triangle text-[#f55a1e] text-2xl"></i>
                </div>
                <div>
                  <div className="font-bold text-[#f55a1e] mb-1 sora">Treinamento obrigatório pendente</div>
                  <div className="text-sm mb-1" style={{color: '#000000cc'}}>Você ainda não realizou o treinamento obrigatório para entregadores. Acesse o treinamento para continuar utilizando a plataforma.</div>
                  <div className="text-xs" style={{color: '#00000066'}}>Agora mesmo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col items-center pt-[48px] pb-[70px] sora overflow-y-auto" style={{maxWidth:'430px'}}>
          {/* Home Page Content */}
          <div className={`w-full ${currentPage === 'home' ? '' : 'hidden'}`}>
            {/* Alert Card */}
            <div className="w-[94%] max-w-[400px] bg-gradient-to-br from-[#f55a1e] to-[#ff7e3e] rounded-2xl p-0 mb-6 mt-4 flex justify-center items-center mx-auto shadow-lg border border-[#ff7e3e]/20">
              <img alt="Banner de treinamento obrigatório Shopee, com ícone de alerta e texto em português sobre o treinamento para entregadores" className="w-full object-cover rounded-2xl" src="https://ppyxcanzwxsbsrokvpky.supabase.co/storage/v1/object/public/app-assets/apps/banners/1756753623789-1jp3dstfhyf.png" style={{maxHeight: '200px'}} />
            </div>
            {/* Square Card Aligned Left with Button Effect and Shadow */}
            <div className="w-full flex justify-start pl-4">
              <button onClick={() => setLocation('/treinamento-app')} aria-label="Acessar treinamento" className="btn-treinamento w-[170px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col sora transition transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#f55a1e] active:scale-95 border border-[#f3f4f6]" style={{border:'none', padding:0}} type="button">
                <div className="relative">
                  <img alt="Banner quadrado Shopee treinamento, ilustração de entregador e texto em português" className="w-full h-[170px] object-cover rounded-t-2xl select-none pointer-events-none transition-shadow duration-200 hover:shadow-xl" draggable="false" src="https://i.ibb.co/nMfSpcM1/assets-task-01k43b21e2eqrszdavwvt81vf6-1756753987-img-0.webp" />
                  <span className="absolute top-2 right-2 bg-white/80 text-[#f55a1e] text-xs font-bold px-2 py-0.5 rounded-full shadow">Novo</span>
                </div>
                <div className="bg-[#FB4903] text-white text-center py-3 text-base font-bold sora transition-colors duration-150 hover:bg-[#e04e1a] shadow-md tracking-wide" style={{borderRadius: '0 0 0 0'}}>
                  ACESSAR TREINAMENTO
                </div>
              </button>
            </div>
            {/* Quick Actions */}
            <div className="w-full max-w-[400px] mx-auto mt-8 flex justify-between px-4">
              <div className="flex flex-col items-center">
                <button onClick={() => showPage('historico')} className="bg-white rounded-0 shadow-lg w-14 h-14 flex items-center justify-center border border-[#f3f4f6] hover:bg-[#fff5f0] transition">
                  <i className="fas fa-history text-[#f55a1e] text-2xl"></i>
                </button>
                <span className="text-xs mt-2 font-medium" style={{color: '#000000cc'}}>Histórico</span>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => showPage('ajuda')} className="bg-white rounded-0 shadow-lg w-14 h-14 flex items-center justify-center border border-[#f3f4f6] hover:bg-[#fff5f0] transition">
                  <i className="fas fa-question-circle text-[#f55a1e] text-2xl"></i>
                </button>
                <span className="text-xs mt-2 font-medium" style={{color: '#000000cc'}}>Ajuda</span>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => showPage('perfil')} className="bg-white rounded-0 shadow-lg w-14 h-14 flex items-center justify-center border border-[#f3f4f6] hover:bg-[#fff5f0] transition">
                  <i className="fas fa-user text-[#f55a1e] text-2xl"></i>
                </button>
                <span className="text-xs mt-2 font-medium" style={{color: '#000000cc'}}>Perfil</span>
              </div>
            </div>
            {/* Section: Dicas rápidas */}
            <div className="w-full max-w-[400px] mx-auto mt-8 px-4 mb-24">
              <h3 className="text-lg font-bold mb-2 text-[#f55a1e]">Dicas rápidas</h3>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                <div className="min-w-[140px] bg-white rounded-xl shadow p-3 flex flex-col items-center border border-[#f3f4f6]">
                  <img alt="Ícone de capacete de entregador laranja, estilo flat" className="w-12 h-12 mb-2" height="60" src="https://png.pngtree.com/png-vector/20240511/ourmid/pngtree-a-motorcycle-helmet-isolated-on-transparent-background-png-image_12438195.png" width="60" />
                  <span className="text-xs text-center" style={{color: '#000000cc'}}>Use sempre o capacete</span>
                </div>
                <div className="min-w-[140px] bg-white rounded-xl shadow p-3 flex flex-col items-center border border-[#f3f4f6]">
                  <img alt="Ícone de caixa de entrega laranja, estilo flat" className="w-12 h-12 mb-2" height="60" src="https://png.pngtree.com/png-vector/20240206/ourmid/pngtree-cartoon-isometric-cardbox-png-image_11667454.png" width="60" />
                  <span className="text-xs text-center" style={{color: '#000000cc'}}>Conferir o pacote antes de sair</span>
                </div>
                <div className="min-w-[140px] bg-white rounded-xl shadow p-3 flex flex-col items-center border border-[#f3f4f6]">
                  <img alt="Ícone de smartphone com mapa, estilo flat" className="w-12 h-12 mb-2" height="60" src="https://img.freepik.com/vetores-premium/ponteiro-de-direcao-vermelho-no-mapa-da-cidade-dobrada_176411-938.jpg" width="60" />
                  <span className="text-xs text-center" style={{color: '#000000cc'}}>Acompanhe o trajeto pelo app</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historico Page Content */}
          <div className={`w-full ${currentPage === 'historico' ? '' : 'hidden'}`}>
            <div className="w-full">
              <div className="bg-[#f55a1e] w-full h-[48px] flex items-center justify-between px-4 mb-6">
                <button onClick={goBackToHome} className="text-white text-xl">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <span className="text-white text-lg font-bold sora">Histórico de Entregas</span>
                <div className="w-6"></div>
              </div>
              <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-6 mb-4 mx-auto shadow-lg border border-[#f3f4f6] text-center">
                <i className="fas fa-box-open text-[#00000066] text-4xl mb-4"></i>
                <h3 className="text-lg font-bold mb-2 text-[#f55a1e]">Nenhuma entrega realizada</h3>
                <p className="text-sm" style={{color: '#00000066'}}>Você ainda não realizou nenhuma entrega. Comece agora mesmo!</p>
                <button onClick={() => {goBackToHome(); showPage('entregas');}} className="mt-4 bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 px-6 rounded-0 shadow transition sora text-sm">
                  Ver entregas disponíveis
                </button>
              </div>
            </div>
          </div>

          {/* Ajuda Page Content */}
          <div className={`w-full ${currentPage === 'ajuda' ? '' : 'hidden'}`}>
            <div className="w-full">
              <div className="bg-[#f55a1e] w-full h-[48px] flex items-center justify-between px-4 mb-6">
                <button onClick={goBackToHome} className="text-white text-xl">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <span className="text-white text-lg font-bold sora">Central de Ajuda</span>
                <div className="w-6"></div>
              </div>
              <div className="w-[94%] max-w-[400px] mx-auto mb-4">
                <h3 className="text-lg font-bold mb-4 text-[#f55a1e] px-2">Procedimentos do Entregador</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>1. Como aceitar uma entrega</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Acesse a aba "Entregas" e selecione uma rota disponível.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>2. Equipamentos de segurança obrigatórios</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Capacete, colete refletivo e bag térmica são itens obrigatórios.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>3. Processo de coleta no centro de distribuição</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Apresente seu código de entregador e aguarde a separação dos pedidos.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>4. Verificação dos pacotes antes da saída</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Confira se todos os códigos de rastreamento coincidem com sua lista.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>5. Como usar o aplicativo durante a entrega</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Mantenha o GPS ligado e atualize o status de cada entrega em tempo real.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>6. Procedimento para entregas em prédios</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Identifique-se com o porteiro e solicite contato com o destinatário.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>7. O que fazer quando o cliente não está presente</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Aguarde 5 minutos, tente contato telefônico e depois marque como "Ausente".</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>8. Como tirar fotos da entrega</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Fotografe o produto entregue e, se possível, inclua o número da casa/apartamento.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>9. Procedimento para pagamento via PIX</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Aguarde a confirmação do pagamento no app antes de finalizar a entrega.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>10. Como proceder com produtos danificados</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Não entregue produtos visivelmente danificados e reporte no app imediatamente.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>11. Horários permitidos para entregas residenciais</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Entregas residenciais das 8h às 22h. Comerciais das 8h às 18h.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>12. Como finalizar o dia de trabalho</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Retorne ao centro de distribuição e devolva produtos não entregues.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>13. Políticas de cancelamento de entregas</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Entregas só podem ser canceladas em casos de força maior ou segurança.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>14. Sistema de avaliação de entregadores</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Sua pontuação é baseada em pontualidade, qualidade do atendimento e entregas realizadas.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                    <h4 className="font-bold text-sm mb-2" style={{color: '#000000cc'}}>15. Contato de emergência e suporte</h4>
                    <p className="text-xs" style={{color: '#00000066'}}>Em caso de emergência, ligue para (11) 4000-1234 ou use o botão SOS no app.</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6] mt-6">
                  <h3 className="text-lg font-bold mb-4 text-[#f55a1e]">Enviar Ticket de Suporte</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#000000cc'}}>Assunto</label>
                      <select className="w-full p-2 border border-gray-300 rounded-0 text-sm" style={{color: '#000000cc'}}>
                        <option>Selecione um assunto</option>
                        <option>Problema com entrega</option>
                        <option>Questão sobre pagamento</option>
                        <option>Problema técnico no app</option>
                        <option>Sugestão de melhoria</option>
                        <option>Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#000000cc'}}>Descrição do problema</label>
                      <textarea className="w-full p-2 border border-gray-300 rounded-0 text-sm h-20 resize-none" placeholder="Descreva detalhadamente sua dúvida ou problema..." style={{color: '#000000cc'}}></textarea>
                    </div>
                    <button className="w-full bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 rounded-0 shadow transition sora text-sm">
                      Enviar Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Perfil Page Content */}
          <div className={`w-full ${currentPage === 'perfil' ? '' : 'hidden'}`}>
            <div className="w-full">
              <div className="bg-[#f55a1e] w-full h-[48px] flex items-center justify-between px-4 mb-6">
                <button onClick={goBackToHome} className="text-white text-xl">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <span className="text-white text-lg font-bold sora">Meu Perfil</span>
                <div className="w-6"></div>
              </div>
              <div className="w-[94%] max-w-[400px] mx-auto mb-4">
                <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6] mb-4">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-[#f55a1e] rounded-full flex items-center justify-center mr-4">
                      <i className="fas fa-user text-white text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{color: '#000000cc'}}>
                        {userData?.name || 'Nome não informado'}
                      </h3>
                      <p className="text-sm" style={{color: '#00000066'}}>ID: #{userData?.id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium" style={{color: '#000000cc'}}>CPF:</span>
                      <span className="text-sm" style={{color: '#00000066'}}>
                        {userData?.cpf || userCpf || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium" style={{color: '#000000cc'}}>Status do Cadastro:</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">ATIVO</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium" style={{color: '#000000cc'}}>Total de Entregas:</span>
                      <span className="text-sm font-bold text-[#f55a1e]">0 entregas</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium" style={{color: '#000000cc'}}>Avaliação:</span>
                      <div className="flex items-center">
                        <span className="text-sm mr-2" style={{color: '#00000066'}}>Novo entregador</span>
                        <div className="flex">
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow border border-[#f3f4f6]">
                  <h4 className="text-base font-bold mb-3 text-[#f55a1e]">Ações do Perfil</h4>
                  <div className="space-y-2">
                    <button onClick={handleLogout} className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 rounded-0 transition text-sm text-left px-3">
                      <i className="fas fa-sign-out-alt mr-2"></i> Sair da conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Entregas Page Content */}
          <div className={`w-full ${currentPage === 'entregas' ? '' : 'hidden'}`}>
            
            {/* Disclaimer */}
            <div className="w-[94%] max-w-[400px] bg-yellow-50 rounded-2xl p-4 mb-4 mt-8 mx-auto shadow border border-yellow-200">
              <div className="flex items-start gap-3">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-lg mt-1"></i>
                <div>
                  <h4 className="font-bold text-yellow-800 mb-2 sora">Atenção!</h4>
                  <p className="text-sm text-yellow-700">
                    Para começar a realizar entregas é obrigatório completar o treinamento de entregadores.
                  </p>
                </div>
              </div>
            </div>

            {/* Ganhos de hoje */}
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow border border-[#f3f4f6]">
              <h3 className="font-bold text-[#f55a1e] mb-3 sora">Ganhos de hoje</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold sora" style={{color: '#000000cc'}}>R$ 0,00</div>
                  <div className="text-sm" style={{color: '#00000066'}}>Ganhos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold sora" style={{color: '#000000cc'}}>0</div>
                  <div className="text-sm" style={{color: '#00000066'}}>Entregas realizadas</div>
                </div>
              </div>
            </div>

            {/* Entregas disponíveis hoje */}
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow border border-[#f3f4f6]">
              <div className="mb-4">
                <h3 className="font-bold text-[#f55a1e] sora">
                  {userData?.city && userData?.state ? `${userData.city} - ${userData.state}` : 'São Paulo - SP'}
                </h3>
                <p className="text-sm" style={{color: '#00000066'}}>
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{color: '#000000cc'}}>Entregas disponíveis:</span>
                  <span className="text-sm font-bold text-[#f55a1e]">82</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{color: '#000000cc'}}>Estimativa de ganhos:</span>
                  <span className="text-sm font-bold text-green-600">R$ 685,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{color: '#000000cc'}}>Tempo estimado:</span>
                  <span className="text-sm font-bold" style={{color: '#000000cc'}}>4h 22min</span>
                </div>
              </div>

              <button 
                disabled 
                className="w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-0 shadow cursor-not-allowed sora text-base flex items-center justify-center gap-2 opacity-70"
              >
                <i className="fas fa-box"></i>
                Realizar entregas
              </button>
              <p className="text-xs text-center mt-2" style={{color: '#00000066'}}>
                Complete o treinamento para habilitar as entregas
              </p>
            </div>

          </div>

          {/* Saldo Page Content */}
          <div className={`w-full ${currentPage === 'saldo' ? '' : 'hidden'}`}>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-6 mb-4 mx-auto shadow-lg mt-8 sora flex flex-col items-center border border-[#f3f4f6]">
              <h2 className="text-2xl font-bold mb-4 sora text-center text-[#f55a1e]">Saldo disponível</h2>
              <div className="flex items-center justify-center mb-6">
                <i className="fas fa-wallet text-[#f55a1e] text-3xl mr-3"></i>
                <span className="text-3xl font-bold sora" style={{color: '#000000cc'}}>R$ 0,00</span>
              </div>
              <button aria-disabled="true" className="bg-gray-300 text-gray-500 font-bold py-3 px-8 rounded-0 cursor-not-allowed text-lg sora shadow-md opacity-70" disabled type="button">
                Realizar saque
              </button>

            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full bg-white flex justify-between items-center h-[85px] z-30 sora" style={{maxWidth:'430px'}}>
          <div className="flex-1 flex flex-col items-center py-1 cursor-pointer sora transition" onClick={() => showPage('home')}>
            <i className={`fas fa-home text-[#f55a1e] text-2xl ${currentPage !== 'home' ? 'opacity-40' : ''}`}></i>
            <span className={`text-[#f55a1e] text-base font-medium mt-1 sora ${currentPage !== 'home' ? 'opacity-40' : ''}`}>Início</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-1 cursor-pointer sora transition" onClick={() => showPage('entregas')}>
            <i className={`fas fa-box text-[#f55a1e] text-2xl ${currentPage !== 'entregas' ? 'opacity-40' : ''}`}></i>
            <span className={`text-[#f55a1e] text-base font-medium mt-1 sora ${currentPage !== 'entregas' ? 'opacity-40' : ''}`}>Entregas</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-1 cursor-pointer sora transition" onClick={() => showPage('saldo')}>
            <i className={`fas fa-wallet text-[#f55a1e] text-2xl ${currentPage !== 'saldo' ? 'opacity-40' : ''}`}></i>
            <span className={`text-[#f55a1e] text-base font-medium mt-1 sora ${currentPage !== 'saldo' ? 'opacity-40' : ''}`}>Saldo</span>
          </div>
        </div>
      </div>
    </>
  );
}