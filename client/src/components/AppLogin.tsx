import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AppLoginProps {
  onLogin: (cpf: string) => void;
}

const AppLogin: React.FC<AppLoginProps> = ({ onLogin }) => {
  const [cpf, setCpf] = useState('');

  // Detectar se é dispositivo móvel
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Solicitar permissão de notificações ao carregar a tela
  useEffect(() => {
    const requestNotificationPermission = async () => {
      console.log('🔍 Iniciando verificação de notificações...');
      console.log('🌐 Hostname:', window.location.hostname);
      console.log('🔒 Is HTTPS:', window.location.protocol === 'https:');
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('📲 Is Mobile:', isMobile());
      console.log('🔔 Notification in window:', 'Notification' in window);
      console.log('🔔 Current permission:', 'Notification' in window ? Notification.permission : 'N/A');
      
      // Verificar contexto seguro (HTTPS ou localhost)
      const isSecureContext = window.isSecureContext || 
                             window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
      
      console.log('🔐 Secure context:', isSecureContext);
      
      // Só solicitar se estiver em contexto seguro e com notificações disponíveis
      if (isSecureContext && 'Notification' in window) {
        console.log('✅ Condições atendidas - solicitando permissão de notificações');
        
        // Verificar se já tem permissão
        if (Notification.permission === 'default') {
          console.log('🔔 Solicitando permissão de notificações...');
          
          try {
            const permission = await Notification.requestPermission();
            console.log('📲 Resultado da permissão:', permission);
            
            if (permission === 'granted') {
              console.log('✅ Permissão de notificações concedida');
              
              // Tentar registrar service worker se ainda não foi registrado
              if ('serviceWorker' in navigator) {
                try {
                  const registration = await navigator.serviceWorker.register('/sw.js');
                  console.log('✅ Service Worker registrado:', registration);
                } catch (swError) {
                  console.error('❌ Erro ao registrar Service Worker:', swError);
                }
              }
            } else if (permission === 'denied') {
              console.log('❌ Permissão de notificações negada');
            }
          } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
          }
        } else {
          console.log('🔔 Permissão já configurada:', Notification.permission);
        }
      } else {
        console.log('❌ Condições não atendidas:');
        console.log('  - Secure context:', isSecureContext);
        console.log('  - Notification API:', 'Notification' in window);
      }
    };

    // Aguardar um pouco antes de solicitar para dar tempo da tela carregar
    const timer = setTimeout(requestNotificationPermission, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Função para formatar CPF automaticamente
  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica formatação
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCPF(e.target.value);
    setCpf(formattedCpf);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Remove formatação para validação
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) {
      setError('Por favor, digite um CPF válido com 11 dígitos');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Tentando login com CPF:', cpf);
      
      // Fazer login via API
      const response = await fetch('/api/app-users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cpf }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Login realizado com sucesso:', data.user);
        
        // Salvar dados do usuário no localStorage
        localStorage.setItem('appUser', JSON.stringify(data.user));
        
        // Se chegou até aqui, CPF é válido, chamar onLogin
        onLogin(cleanCpf);
      } else {
        console.log('❌ Falha no login:', data.message);
        setError(data.message || 'Usuário não encontrado. Realize o cadastro primeiro.');
      }
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidCpf = cpf.replace(/\D/g, '').length === 11;

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col sora" style={{maxWidth:'430px',margin:'0 auto',boxShadow:'0 0 24px 0 rgba(0,0,0,0.08)',height:'100vh'}}>
      {/* Header igual ao do app */}
      <div className="bg-[#f55a1e] w-full h-[48px] fixed top-0 left-0 flex items-center justify-between px-4 z-30 sora" style={{maxWidth:'430px'}}>
        <div className="flex items-center">
          <div className="w-[36px] h-[36px] flex items-center justify-center">
            <img alt="Shopee logo icon, white bag with orange S on orange background" className="w-7 h-7" height="28" src="https://freelogopng.com/images/all_img/1656181355shopee-icon-white.png" width="28" />
          </div>
        </div>
        <div>
          <button aria-label="Login" className="relative focus:outline-none">
            <i className="fas fa-user text-white text-xl"></i>
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 pt-[80px] sora">
        <div className="w-full max-w-md">
          
          {/* Box de aviso laranja sobre notificações */}
          <div className="bg-orange-100 border border-orange-300 p-4 mb-6 sora" style={{borderRadius: '0'}}>
            <div className="flex items-start gap-3">
              <i className="fas fa-bell text-orange-600 text-lg mt-1"></i>
              <div>
                <h4 className="font-bold text-orange-800 mb-2 sora">Notificações Obrigatórias</h4>
                <p className="text-sm text-orange-700 sora">
                  É obrigatório permitir as notificações do app para receber avisos importantes sobre suas entregas.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de login */}
          <div className="bg-white shadow-lg p-6 border border-[#f3f4f6] sora" style={{borderRadius: '0'}}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2 sora" style={{color: '#000000cc'}}>Acesso ao Aplicativo</h2>
              <p className="text-sm sora" style={{color: '#00000066'}}>Digite seu CPF para acessar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 sora" style={{color: '#000000cc'}}>
                  CPF
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full text-center text-lg tracking-wider sora border border-gray-300"
                  maxLength={14}
                  style={{ fontSize: '16px', borderRadius: '0' }}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm sora" style={{borderRadius: '0'}}>
                  {error}
                </div>
              )}
              
              <Button
                type="submit"
                disabled={!isValidCpf || isLoading}
                className={`w-full py-3 text-white font-bold sora transition-all ${
                  (isValidCpf && !isLoading)
                    ? 'bg-[#f55a1e] hover:bg-[#d73919] shadow-lg transform active:translate-y-0.5' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                style={{
                  borderRadius: '0',
                  boxShadow: (isValidCpf && !isLoading) ? "0 4px 0 0 #c23218" : "none"
                }}
              >
                {isLoading ? 'Verificando...' : 'Acessar'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs sora" style={{color: '#00000066'}}>
                Ao continuar, você concorda com nossos termos de uso
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLogin;