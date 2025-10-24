import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { API_BASE_URL } from '../lib/api-config';
import { initFacebookPixel, trackPurchase } from '@/lib/facebook-pixel';
import { trackKwaiPurchase } from '@/lib/kwai-pixel';
import ConversionTracker from '@/components/ConversionTracker';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import KwaiPixelHead from '@/components/KwaiPixelHead';
import FacebookPixelHead from '@/components/FacebookPixelHead';

import pixLogo from '../assets/pix-logo.png';
import kitEpiImage from '../assets/kit-epi-new.webp';

interface PaymentInfo {
  id: string;
  pixCode: string;
  pixQrCode: string;
  timeLeft?: number;
  status?: string;
  approvedAt?: string;
  rejectedAt?: string;
  facebookReported?: boolean;
}

const Payment: React.FC = () => {
  useScrollTop();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutos em segundos
  const timerRef = useRef<number | null>(null);
  
  // Informações do usuário
  const [name, setName] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Buscar parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const emailParam = urlParams.get('email');
    
    if (!id) {
      setErrorMessage('Link de pagamento inválido. Falta o ID da transação.');
      setIsLoading(false);
      return;
    }
    
    // Email é opcional - pode vir da URL ou do localStorage
    if (emailParam) {
      setEmail(emailParam);
    }
    
    fetchPaymentInfo(id);
  }, []);

  // Buscar informações de pagamento da API
  const fetchPaymentInfo = async (id: string) => {
    try {
      setIsLoading(true);
      console.log('[PAYMENT] Carregando informações de pagamento para ID:', id);
      
      // Usar o endpoint de transações com cache-busting
      const cacheBuster = Date.now();
      const url = `${API_BASE_URL}/api/transactions/${id}/status?t=${cacheBuster}`;
      console.log('[PAYMENT] Fazendo requisição para:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[PAYMENT] Resposta da API:', data);
      
      // Buscar dados do localStorage se disponível
      if (!data.transaction?.customer_name || !data.transaction?.customer_cpf) {
        const candidatoData = localStorage.getItem('candidato_data');
        if (candidatoData) {
          try {
            const userData = JSON.parse(candidatoData);
            console.log('[PAYMENT] Dados encontrados no localStorage:', userData);
            
            if (!data.transaction?.customer_name && userData.nome) {
              setName(userData.nome);
            }
            if (!data.transaction?.customer_cpf && userData.cpf) {
              setCpf(userData.cpf);
            }
          } catch (error) {
            console.error('[PAYMENT] Erro ao parsear dados do localStorage:', error);
          }
        }
      }
      
      // Atualizar as informações básicas do pagamento
      const pixCode = data.transaction?.pix_code || '';
      const pixQrCode = data.transaction?.pix_qr_code || '';
      
      console.log('[PAYMENT] Dados PIX extraídos:', {
        pixCode: pixCode ? `${pixCode.substring(0, 20)}...` : 'VAZIO',
        pixQrCode: pixQrCode ? `${pixQrCode.substring(0, 20)}...` : 'VAZIO'
      });
      
      setPaymentInfo({
        id: data.transaction?.gateway_id || id,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        status: data.status?.toUpperCase() || 'PENDING',
        approvedAt: data.transaction?.approved_at,
        rejectedAt: data.transaction?.rejected_at,
        facebookReported: data.transaction?.facebook_reported
      });
      
      // Se há código PIX, pode parar o loading (QR code pode ser gerado no frontend)
      if (pixCode) {
        console.log('[PAYMENT] ✅ Código PIX recebido com sucesso!');
        setIsLoading(false);
      } else {
        console.log('[PAYMENT] ⏳ Aguardando código PIX... Continuará carregando.');
        // Manter loading ativo - será desligado quando o código chegar via polling
      }

      // 🚀 POLLING NO BACKEND - SEMPRE ATIVO!
      console.log('[PAYMENT] Iniciando polling no backend para transação:', id);
      startBackendPolling(id);
    } catch (error: any) {
      console.error('Erro ao recuperar informações de pagamento:', error);
      setErrorMessage(error.message || 'Ocorreu um erro ao carregar as informações de pagamento.');
      setIsLoading(false);
    }
  };

  // 🚀 POLLING NO BACKEND - SEMPRE ATIVO!
  const startBackendPolling = (transactionId: string) => {
    console.log(`[BACKEND-POLL] Iniciando polling no backend para transação: ${transactionId}`);
    
    const checkPayment = async () => {
      try {
        // Cache busting para garantir dados frescos
        const cacheBuster = Date.now();
        const url = `${API_BASE_URL}/api/transactions/${transactionId}/status?t=${cacheBuster}`;
        
        console.log(`[BACKEND-POLL] Verificando status: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[BACKEND-POLL] Status recebido para ${transactionId}:`, data.status);
          
          // Atualizar código PIX se chegou e ainda não temos
          const newPixCode = data.transaction?.pix_code || '';
          const newPixQrCode = data.transaction?.pix_qr_code || '';
          
          if (newPixCode) {
            setPaymentInfo(prev => {
              // Se já temos o código, não precisa atualizar
              if (prev?.pixCode) {
                return prev;
              }
              
              // Atualizar com o novo código
              console.log('[BACKEND-POLL] ✅ Código PIX recebido via polling!');
              setIsLoading(false); // Desligar loading quando código chegar
              
              return {
                ...prev!,
                pixCode: newPixCode,
                pixQrCode: newPixQrCode
              };
            });
          }
          
          // Verificar múltiplos status de pagamento aprovado (case-insensitive)
          const statusUpper = data.status?.toUpperCase();
          if (['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED', 'SUCCESS'].includes(statusUpper)) {
            console.log(`🎉 [BACKEND-POLL] PAGAMENTO APROVADO! Redirecionando para /treinamento`);
            
            // Track conversion no Facebook Pixel e Kwai Pixel
            if (typeof trackPurchase === 'function') {
              trackPurchase(transactionId, 64.97, 'BRL');
            }
            trackKwaiPurchase(transactionId, 64.97, 'BRL');
            
            // Mostrar toast de sucesso
            toast({
              title: "✅ Pagamento Confirmado!",
              description: "Redirecionando para o treinamento...",
              variant: "default",
            });
            
            // Redirecionamento IMEDIATO
            setLocation('/treinamento');
            return; // Para o polling
          }
        } else {
          console.warn(`[BACKEND-POLL] Erro HTTP ${response.status} ao verificar ${transactionId}`);
        }
        
        // Continuar verificando a cada 1 segundo se não está pago
        setTimeout(checkPayment, 1000);
        
      } catch (error) {
        console.error(`[BACKEND-POLL] Erro ao verificar ${transactionId}:`, error);
        // Continuar verificando mesmo com erro
        setTimeout(checkPayment, 1000);
      }
    };
    
    // Iniciar verificação
    checkPayment();
  };

  // Configurar apenas o cronômetro
  useEffect(() => {
    if (paymentInfo) {
      // Configurar o cronômetro de contagem regressiva
      if (timeLeft > 0 && paymentInfo.status !== 'APPROVED' && paymentInfo.status !== 'REJECTED') {
        timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000) as unknown as number;
      }
      
      console.log('[PAYMENT] Sistema de polling direto ativo.');
    }
    
    // Limpar cronômetro quando componente for desmontado
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentInfo?.id, paymentInfo?.status, timeLeft]);
  
  // Inicializar o Facebook Pixel quando o componente é montado
  useEffect(() => {
    initFacebookPixel();
  }, []);

  // Formatar o tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copiar código PIX para área de transferência
  const copiarCodigoPix = () => {
    if (paymentInfo?.pixCode) {
      navigator.clipboard.writeText(paymentInfo.pixCode);
      toast({
        title: "Código PIX copiado!",
        description: "O código PIX foi copiado para a área de transferência.",
      });
    }
  };

  // Verifica se o pagamento está aprovado para rastrear conversão
  const isApproved = paymentInfo?.status && 
    ['APPROVED', 'approved', 'PAID', 'paid', 'COMPLETED', 'completed'].includes(
      paymentInfo.status.toUpperCase()
    );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <FacebookPixelHead />
      <KwaiPixelHead />
      {/* Componente de rastreamento de conversão que não renderiza nada visualmente */}
      {isApproved && (
        <ConversionTracker 
          transactionId={paymentInfo.id} 
          amount={64.97} 
          enabled={true} 
        />
      )}
      
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        {/* Meia-lua no canto direito */}
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <i className="fas fa-chevron-right text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Pagamento Personalizado</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22] text-center">Pagamento do Kit de Segurança</h3>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-[#E83D22]">
                    <Spinner size="lg" />
                  </div>
                  <p className="mt-4 text-gray-600">Carregando informações de pagamento...</p>
                </div>
              ) : errorMessage ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="text-red-500 mr-3">
                      <i className="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-red-800 font-semibold mb-1">Erro</h4>
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-reload"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : paymentInfo ? (
                <>
                  {/* Timer */}
                  <div className="bg-[#FFF8F6] border border-[#E83D2220] rounded-lg p-3 mb-4">
                    <div className="text-center">
                      <h4 className="text-[#E83D22] font-semibold text-sm mb-1">Tempo restante para pagamento</h4>
                      <div className="text-2xl font-bold text-[#E83D22]" data-testid="text-timer">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </div>

                  {/* Valor do pagamento */}
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-[#E83D22] mb-2" data-testid="text-amount">
                      R$ 64,97
                    </div>
                    <p className="text-gray-600 text-sm">Kit de Segurança + Treinamento</p>
                  </div>

                  {/* Status do pagamento */}
                  <div className="text-center mb-4">
                    <div 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        paymentInfo.status === 'APPROVED' || paymentInfo.status === 'PAID' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                      data-testid={`status-${paymentInfo.status?.toLowerCase()}`}
                    >
                      {paymentInfo.status === 'APPROVED' || paymentInfo.status === 'PAID' ? (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>
                          Pagamento Aprovado
                        </>
                      ) : (
                        <>
                          <i className="fas fa-clock mr-2"></i>
                          Aguardando Pagamento
                        </>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  {paymentInfo.pixCode && (
                    <div className="text-center mb-6">
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
                        <QRCodeGenerator 
                          value={paymentInfo.pixCode}
                          size={200}
                          data-testid="qr-code"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Escaneie o QR Code ou copie o código PIX abaixo
                      </p>
                    </div>
                  )}

                  {/* Código PIX */}
                  {paymentInfo.pixCode && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código PIX Copia e Cola:
                      </label>
                      <div className="relative">
                        <textarea
                          value={paymentInfo.pixCode}
                          readOnly
                          className="w-full p-3 text-xs border border-gray-300 rounded-lg bg-gray-50 resize-none"
                          rows={4}
                          data-testid="input-pix-code"
                        />
                        <Button
                          onClick={copiarCodigoPix}
                          className="absolute top-2 right-2 bg-[#E83D22] hover:bg-[#D73621] text-white text-xs px-3 py-1"
                          data-testid="button-copy-pix"
                        >
                          <i className="fas fa-copy mr-1"></i>
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Instruções */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <i className="fas fa-info-circle mr-2"></i>
                      Como pagar com PIX:
                    </h4>
                    <ol className="text-blue-700 text-sm space-y-1">
                      <li>1. Abra o app do seu banco</li>
                      <li>2. Escolha a opção PIX</li>
                      <li>3. Escaneie o QR Code ou cole o código</li>
                      <li>4. Confirme o pagamento</li>
                      <li>5. Você será redirecionado automaticamente após a confirmação</li>
                    </ol>
                  </div>

                  {/* Kit de segurança */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={kitEpiImage} 
                        alt="Kit de Segurança" 
                        className="w-16 h-16 object-cover rounded-lg"
                        data-testid="img-kit"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">Kit de Segurança Shopee</h4>
                        <p className="text-sm text-gray-600">
                          Equipamentos de proteção + Treinamento completo
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Payment;