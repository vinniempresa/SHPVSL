import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from 'use-debounce';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAppContext } from '@/contexts/AppContext';
import { LoadingModal } from '@/components/LoadingModal';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { VehicleInfoBox } from '@/components/VehicleInfoBox';
import KwaiPixelHead from '@/components/KwaiPixelHead';
import FacebookPixelHead from '@/components/FacebookPixelHead';

import shopeeMotoImage from '../assets/shopee-moto.webp';
import shopeeCarsImage from '../assets/shopee-cars.webp';

const formSchema = z.object({
  cpf: z.string()
    .min(11, "CPF inválido")
    .max(14, "CPF inválido")
    .refine(value => {
      // Remove caracteres não numéricos
      const numericValue = value.replace(/\D/g, '');
      return numericValue.length === 11;
    }, "CPF deve ter 11 dígitos"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  dataNascimento: z.string().optional(),
  telefone: z.string()
    .min(14, "Telefone inválido")
    .max(15, "Telefone inválido")
    .refine(value => {
      // Remove caracteres não numéricos
      const numericValue = value.replace(/\D/g, '');
      return numericValue.length === 11;
    }, "Telefone deve ter exatamente 11 dígitos"),
  email: z.string().email("Email inválido"),
  isRentedCar: z.boolean().optional().default(false),
  placa: z.string()
    .min(7, "Placa inválida")
    .max(9, "Placa inválida")
    .refine(value => {
      // Remove caracteres não alfanuméricos
      const cleanValue = value.replace(/[^A-Za-z0-9]/g, '');
      
      // Formato antigo: 3 letras e 4 números (AAA0000)
      const antigoRegex = /^[A-Za-z]{3}[0-9]{4}$/;
      
      // Formato Mercosul: 4 letras e 3 números (AAA0A00)
      const mercosulRegex = /^[A-Za-z]{3}[0-9][A-Za-z][0-9]{2}$/;
      
      return antigoRegex.test(cleanValue) || mercosulRegex.test(cleanValue);
    }, "Formato deve ser ABC-1234 (antigo) ou ABC1D23 (Mercosul)")
    .optional()
    .or(z.literal('')) // Permitir string vazia
})
// Adiciona validação condicional para placa
.refine(
  (data) => {
    // Se marcou como carro alugado, não precisa de placa
    if (data.isRentedCar) {
      return true;
    }
    
    // Se não é carro alugado, precisa ter placa válida
    return data.placa && data.placa.length >= 7;
  },
  {
    message: "Informe a placa do veículo ou selecione a opção 'Carro alugado'",
    path: ["placa"]
  }
);

type FormValues = z.infer<typeof formSchema>;

enum TipoVeiculo {
  CARRO = "carro",
  MOTO = "moto",
}

const Cadastro: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  const { cepData } = useAppContext();
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [isLoadingVehicleInfo, setIsLoadingVehicleInfo] = useState(false);
  const [vehicleIsValid, setVehicleIsValid] = useState(false);
  const [isRentedCar, setIsRentedCar] = useState(false);
  const [isLoadingCpfInfo, setIsLoadingCpfInfo] = useState(false);
  const [cpfData, setCpfData] = useState<{
    nome?: string;
    data_nascimento?: string;
    nome_mae?: string;
    sexo?: string;
  } | null>(null);
  const [showBirthDateField, setShowBirthDateField] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<{
    marca?: string;
    modelo?: string;
    ano?: string;
    anoModelo?: string;
    chassi?: string;
    cor?: string;
  } | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf: '',
      nome: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      placa: '',
    }
  });

  const cpfValue = watch('cpf');
  const nomeValue = watch('nome');
  const dataNascimentoValue = watch('dataNascimento');
  const telefoneValue = watch('telefone');
  const placaValue = watch('placa');
  const [debouncedCpf] = useDebounce(cpfValue, 1000);
  const [debouncedPlaca] = useDebounce(placaValue, 1000);
  
  // Efeito para buscar informações do CPF quando mudar
  useEffect(() => {
    if (debouncedCpf) {
      const numericCpf = debouncedCpf.replace(/\D/g, '');
      if (numericCpf.length === 11) {
        fetchCpfInfo(numericCpf);
      }
    }
  }, [debouncedCpf]);
  
  // REMOVIDO: useEffect que chamava fetchVehicleInfo
  // Agora o VehicleInfoBox component cuida disso automaticamente

  // Formatação de CPF
  const formatCpf = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 3) return numericValue;
    if (numericValue.length <= 6) return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
    if (numericValue.length <= 9) return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
  };

  // Formatação de telefone (somente 11 dígitos)
  const formatTelefone = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 11); // Limita a 11 dígitos
    if (numericValue.length <= 2) return numericValue;
    if (numericValue.length <= 7) return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7)}`;
  };

  // Formatação de data de nascimento
  const formatDataNascimento = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 8); // Limita a 8 dígitos
    if (numericValue.length <= 2) return numericValue;
    if (numericValue.length <= 4) return `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
    return `${numericValue.slice(0, 2)}/${numericValue.slice(2, 4)}/${numericValue.slice(4)}`;
  };

  // Formatação da placa no formato XXX-0000 (antigo) ou AAA0A00 (Mercosul)
  const formatPlaca = (value: string) => {
    value = value.toUpperCase();
    const cleanValue = value.replace(/[^A-Z0-9]/g, '');
    
    if (cleanValue.length <= 3) {
      return cleanValue;
    } else if (cleanValue.length === 7) {
      // Verifica se é formato antigo (3 letras + 4 números)
      if (/^[A-Z]{3}[0-9]{4}$/.test(cleanValue)) {
        // Formato antigo XXX-0000
        return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
      } 
      // Formato Mercosul
      else if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanValue)) {
        // Não formata com hífen, apenas retorna
        return cleanValue;
      }
      // Outro formato de 7 caracteres - aplica o hífen comum
      else {
        return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
      }
    } else {
      // Para outros comprimentos, retorna o valor limpo
      return cleanValue;
    }
  };

  // Handlers para formatação automática
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setValue('cpf', formatted);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setValue('telefone', formatted);
  };

  const handleDataNascimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDataNascimento(e.target.value);
    setValue('dataNascimento', formatted);
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlaca(e.target.value);
    setValue('placa', formatted);
  };

  // Obter a URL base da API do backend dependendo do ambiente
  const getApiBaseUrl = () => {
    // Sempre usa URL relativa pois frontend e backend estão no mesmo servidor
    return '';
  };

  // Função para buscar informações do CPF
  const fetchCpfInfo = async (cpf: string) => {
    if (!cpf || cpf.length !== 11) {
      return;
    }

    try {
      setIsLoadingCpfInfo(true);
      
      console.log(`[CPF] Buscando dados para CPF: ${cpf}`);
      
      const apiUrl = `https://api.amnesiatecnologia.rocks/?token=261207b9-0ec2-468a-ac04-f9d38a51da88&cpf=${cpf}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[CPF] Dados recebidos:', data);
        
        if (data.DADOS) {
          setCpfData(data.DADOS);
          
          // Preencher o nome automaticamente
          if (data.DADOS.nome) {
            setValue('nome', data.DADOS.nome);
          }
          
          // Mostrar campo de data de nascimento e preencher se disponível
          if (data.DADOS.data_nascimento) {
            setShowBirthDateField(true);
            setValue('dataNascimento', data.DADOS.data_nascimento);
          }
          
          toast({
            title: "CPF encontrado!",
            description: "Dados preenchidos automaticamente. Você pode editá-los se necessário.",
            variant: "default",
          });
        }
      } else {
        console.warn('[CPF] API retornou erro:', response.status);
        setCpfData(null);
      }
    } catch (error) {
      console.error('[CPF] Erro ao buscar dados:', error);
      setCpfData(null);
    } finally {
      setIsLoadingCpfInfo(false);
    }
  };
  
  // Função para buscar informações do veículo pela placa
  const fetchVehicleInfo = async (placa: string) => {
    if (!placa || placa.length < 7) {
      setVehicleInfo(null);
      return;
    }

    // Limpar a placa - remover hífen para consulta
    const cleanedPlaca = placa.replace('-', '');
    
    if (cleanedPlaca.length < 7) {
      return;
    }

    try {
      setIsLoadingVehicleInfo(true);
      
      // Determinar ambiente (produção vs desenvolvimento)
      const hostname = window.location.hostname;
      const isProduction = hostname.includes('netlify.app') || 
                          hostname.includes('shopee-parceiro.com') ||
                          hostname === 'shopee-entregador.com';
      
      console.log(`[DEBUG] Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}, Host: ${hostname}`);
      
      let vehicleData = null;
      
      // MÉTODO 1: Em produção, SEMPRE usar o proxy Netlify primeiro
      if (isProduction) {
        try {
          console.log('[DEBUG] Usando proxy Netlify para consulta de placa');
          // Usar caminho relativo à raiz do site
          const proxyUrl = `/vehicle-api/${cleanedPlaca}`;
          console.log(`[DEBUG] URL do proxy: ${proxyUrl}`);
          
          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            // Garantir que estamos usando o modo de CORS default
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (proxyResponse.ok) {
            vehicleData = await proxyResponse.json();
            console.log('[INFO] Dados do veículo obtidos via proxy Netlify:', vehicleData);
          } else {
            const errorStatus = proxyResponse.status;
            console.warn(`[AVISO] Proxy falhou com status: ${errorStatus}`);
            
            if (errorStatus === 404) {
              // Possível problema nos redirecionamentos do Netlify
              console.log('[DEBUG] Tentando URL alternativa no Netlify');
              // Tentar com o caminho completo para a função
              const altProxyUrl = `/.netlify/functions/vehicle-proxy/${cleanedPlaca}`;
              
              const altResponse = await fetch(altProxyUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              });
              
              if (altResponse.ok) {
                vehicleData = await altResponse.json();
                console.log('[INFO] Dados obtidos via caminho alternativo do Netlify:', vehicleData);
              } else {
                console.error('[ERRO] Caminho alternativo do Netlify também falhou:', altResponse.status);
              }
            }
          }
        } catch (proxyError) {
          console.error('[ERRO] Falha ao consultar via proxy:', proxyError);
        }
      }
      
      // MÉTODO 2: Em desenvolvimento, tentar API direta (ou como fallback em produção)
      if (!vehicleData && (!isProduction || (isProduction && localStorage.getItem('allow_direct_api') === 'true'))) {
        const apiKey = import.meta.env.VITE_VEHICLE_API_KEY;
        
        if (apiKey) {
          try {
            console.log('[DEBUG] Tentando consulta direta à API de veículos');
            const headers = new Headers();
            const authValue = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
            headers.append('Authorization', authValue);
            
            const apiUrl = `https://wdapi2.com.br/consulta/${cleanedPlaca}`;
            console.log(`[DEBUG] URL da API direta: ${apiUrl}`);
            
            const directResponse = await fetch(apiUrl, { 
              method: 'GET',
              headers: headers
            });
            
            if (directResponse.ok) {
              vehicleData = await directResponse.json();
              console.log('[INFO] Dados do veículo obtidos via API direta');
            } else if (!apiKey.startsWith('Bearer ')) {
              // Tentar sem o prefixo Bearer
              console.log('[DEBUG] Tentando novamente sem prefixo Bearer');
              const headersWithoutBearer = new Headers();
              headersWithoutBearer.append('Authorization', apiKey);
              
              const retryResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: headersWithoutBearer
              });
              
              if (retryResponse.ok) {
                vehicleData = await retryResponse.json();
                console.log('[INFO] Dados do veículo obtidos via API direta (sem Bearer)');
              } else {
                console.warn('[AVISO] Consulta direta falhou em todas as tentativas');
              }
            }
          } catch (apiError) {
            console.error('[ERRO] Falha ao consultar API direta:', apiError);
          }
        } else {
          console.warn('[AVISO] API Key não disponível para consulta direta');
        }
      }
      
      // MÉTODO 3: Fallback para backend Heroku (DESATIVADO EM PRODUÇÃO por causa do CORS)
      if (!vehicleData && !isProduction) {
        try {
          console.log('[DEBUG] Tentando consultar via backend Heroku');
          const apiUrl = `${getApiBaseUrl()}/api/vehicle-info/${cleanedPlaca}`;
          const backendResponse = await fetch(apiUrl);
          
          if (backendResponse.ok) {
            vehicleData = await backendResponse.json();
            console.log('[INFO] Dados do veículo obtidos via backend Heroku');
          } else {
            console.error('[ERRO] Backend falhou, status:', backendResponse.status);
          }
        } catch (backendError) {
          console.error('[ERRO] Falha ao consultar backend:', backendError);
        }
      }
      
      // Processar os dados obtidos
      if (vehicleData) {
        setVehicleInfo({
          marca: vehicleData.MARCA || vehicleData.marca || "Não informado",
          modelo: vehicleData.MODELO || vehicleData.modelo || "Não informado",
          ano: vehicleData.ano || vehicleData.anoModelo || "Não informado",
          anoModelo: vehicleData.anoModelo || "Não informado",
          chassi: vehicleData.chassi || "Não informado", 
          cor: vehicleData.cor || "Não informado"
        });
      } else {
        console.error('[ERRO] Todas as tentativas de obter dados do veículo falharam');
        setVehicleInfo(null);
      }
    } catch (error) {
      console.error('Erro ao buscar informações do veículo:', error);
      setVehicleInfo(null);
    } finally {
      setIsLoadingVehicleInfo(false);
    }
  };

  // Limpar o campo de placa e informações do veículo
  const handleClearPlate = () => {
    setValue('placa', '');
    setVehicleInfo(null);
  };
  
  // Handler para a opção de carro alugado
  const handleRentedCarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsRentedCar(checked);
    setValue('isRentedCar', checked);
    
    // Se marcar como alugado, limpar a placa e as informações do veículo
    if (checked) {
      setValue('placa', '');
      setVehicleInfo(null);
      setVehicleIsValid(true); // Considerar como válido para permitir o envio do formulário
    } else {
      setVehicleIsValid(false); // Voltar a validação normal da placa
    }
  };

  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    // Redirecionar para a próxima página
    navigate('/municipios');
  };

  const onSubmit = async (data: FormValues) => {
    if (!tipoVeiculo) {
      toast({
        title: "Erro de validação",
        description: "Selecione o tipo de veículo (Carro ou Moto)",
        variant: "destructive",
      });
      return;
    }

    if (!cepData) {
      toast({
        title: "Erro de validação",
        description: "Informações de CEP não encontradas. Por favor, recarregue a página.",
        variant: "destructive",
      });
      return;
    }
    
    // Verifica se precisa validar a placa (não precisa se for carro alugado)
    if (!isRentedCar && !vehicleIsValid) {
      toast({
        title: "Erro de validação",
        description: "Por favor, insira uma placa válida para verificar as informações do veículo ou selecione a opção 'Carro alugado'",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Armazenar dados no localStorage para uso posterior
      const candidatoData = {
        ...data,
        tipoVeiculo,
        estado: cepData.state,
        cidade: cepData.city,
        cep: cepData.cep,
        // Dados do veículo
        placa: data.placa || '',
        isRentedCar,
        vehicleInfo: vehicleInfo || null,
      };

      console.log('[CADASTRO] Salvando dados do candidato:', candidatoData);
      localStorage.setItem('candidato_data', JSON.stringify(candidatoData));
      
      // Salvar os dados do usuário para mostrar na página de entrega
      const userData = {
        nome: data.nome,
        cpf: data.cpf,
        dataNascimento: data.dataNascimento,
        tipoVeiculo: tipoVeiculo,
        cidade: cepData.city,
        estado: cepData.state
      };
      
      console.log('[CADASTRO] Salvando dados do usuário:', userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Também salvar apenas o nome separadamente como backup
      localStorage.setItem('user_name', data.nome);
      localStorage.setItem('user_cpf', data.cpf);
      
      // NOVA FUNCIONALIDADE: Salvar dados do usuário no banco de dados
      try {
        console.log('💾 Salvando dados do usuário no banco de dados...');
        const response = await fetch('/api/app-users/save-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cpf: data.cpf,
            name: data.nome,
            city: cepData.city,
            state: cepData.state // Incluir estado (UF) do CEP
          }),
        });
        
        const result = await response.json();
        if (result.success) {
          console.log('✅ Dados do usuário salvos no banco:', result.user);
        } else {
          console.warn('⚠️ Falha ao salvar no banco:', result.message);
        }
      } catch (error) {
        console.error('❌ Erro ao salvar dados do usuário:', error);
        // Não bloquear o fluxo se houver erro no banco
      }
      
      // Mostrar o modal de carregamento em vez de navegar diretamente
      setShowLoadingModal(true);
      
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <FacebookPixelHead />
      <KwaiPixelHead />
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
      
      <div className="flex-grow container mx-auto px-2 py-8 w-full">
        <div className="w-full mx-auto p-6 mb-8">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Cadastro de Entregador Parceiro</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="cpf" className="block text-base font-medium text-gray-800 mb-2">
                  CPF
                </label>
                <div className="relative">
                  <Input
                    id="cpf"
                    {...register('cpf')}
                    value={cpfValue}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    className={errors.cpf ? 'border-red-500' : ''}
                    inputMode="numeric"
                  />
                  {isLoadingCpfInfo && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#E83D22]"></div>
                    </div>
                  )}
                </div>
                {errors.cpf && (
                  <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="nome" className="block text-base font-medium text-gray-800 mb-2">
                  Nome Completo
                </label>
                <Input
                  id="nome"
                  {...register('nome')}
                  value={nomeValue}
                  placeholder="Digite seu nome completo"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              {/* Campo de data de nascimento (aparecerá dinamicamente) */}
              {showBirthDateField && (
                <div>
                  <label htmlFor="dataNascimento" className="block text-base font-medium text-gray-800 mb-2">
                    Data de Nascimento
                  </label>
                  <Input
                    id="dataNascimento"
                    {...register('dataNascimento')}
                    value={dataNascimentoValue}
                    onChange={handleDataNascimentoChange}
                    placeholder="dd/mm/aaaa"
                    className={errors.dataNascimento ? 'border-red-500' : ''}
                    inputMode="numeric"
                  />
                  {errors.dataNascimento && (
                    <p className="mt-1 text-sm text-red-600">{errors.dataNascimento.message}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="telefone" className="block text-base font-medium text-gray-800 mb-2">
                  Telefone
                </label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  value={telefoneValue}
                  onChange={handleTelefoneChange}
                  placeholder="(00) 00000-0000"
                  className={errors.telefone ? 'border-red-500' : ''}
                  inputMode="numeric"
                />
                {errors.telefone && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-base font-medium text-gray-800 mb-2">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="pt-4">
                <label className="block text-lg font-medium text-gray-800 mb-4">
                  Qual veículo você utiliza?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoVeiculo(TipoVeiculo.CARRO)}
                    className={`flex flex-col items-center justify-center p-6 ${
                      tipoVeiculo === TipoVeiculo.CARRO
                        ? 'border-[#E83D22] border-3 bg-[#FFF8F6]'
                        : 'border-gray-200 border-2 bg-white hover:bg-gray-50'
                    } rounded-lg transition-colors`}
                  >
                    <div className="mb-3 h-24 flex items-center justify-center">
                      <img src={shopeeCarsImage} alt="Carros Shopee" className="h-full w-auto object-contain" />
                    </div>
                    <span className={`font-medium ${
                      tipoVeiculo === TipoVeiculo.CARRO ? 'text-[#E83D22]' : 'text-gray-700'
                    }`}>
                      Carro
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTipoVeiculo(TipoVeiculo.MOTO)}
                    className={`flex flex-col items-center justify-center p-6 ${
                      tipoVeiculo === TipoVeiculo.MOTO
                        ? 'border-[#E83D22] border-3 bg-[#FFF8F6]'
                        : 'border-gray-200 border-2 bg-white hover:bg-gray-50'
                    } rounded-lg transition-colors`}
                  >
                    <div className="mb-3 h-20 flex items-center justify-center">
                      <img src={shopeeMotoImage} alt="Moto Shopee" className="h-full object-contain" />
                    </div>
                    <span className={`font-medium ${
                      tipoVeiculo === TipoVeiculo.MOTO ? 'text-[#E83D22]' : 'text-gray-700'
                    }`}>
                      Moto
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                {/* Opção de Carro alugado */}
                <div className="p-4 mb-6 bg-[#FFF8F6] border border-[#E83D2230] rounded-md">
                  <h3 className="font-medium text-[#E83D22] mb-2">Opção para Veículo Alugado</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Se você trabalha com um veículo alugado ou emprestado, selecione esta opção 
                    para prosseguir sem a necessidade de informar a placa do veículo.
                  </p>
                  <div className="flex items-center">
                    <input
                      id="isRentedCar"
                      type="checkbox"
                      checked={isRentedCar}
                      onChange={handleRentedCarChange}
                      className="w-5 h-5 text-[#E83D22] rounded border-gray-300 focus:ring-[#E83D22]"
                    />
                    <label
                      htmlFor="isRentedCar"
                      className="ml-2 text-base font-bold text-[#E83D22] leading-tight"
                    >
                      Estou utilizando um veículo alugado ou emprestado
                    </label>
                  </div>
                </div>

                {/* Campo de placa - exibido apenas se não for carro alugado */}
                {!isRentedCar && (
                  <>
                    <label htmlFor="placa" className="block text-base font-medium text-gray-800 mb-2">
                      Placa do Veículo
                    </label>
                    <div className="relative">
                      <Input
                        id="placa"
                        {...register('placa')}
                        onChange={handlePlacaChange}
                        placeholder="ABC-1234 ou ABC1D23"
                        className={`${errors.placa ? 'border-red-500' : ''} ${isLoadingVehicleInfo ? 'pr-10' : ''}`}
                        inputMode="text"
                        type="search" 
                        autoCapitalize="characters"
                      />
                      {isLoadingVehicleInfo && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-[#E83D22] border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {errors.placa && (
                      <p className="mt-1 text-sm text-red-600">{errors.placa.message}</p>
                    )}
                  </>
                )}
                
                {/* Área para mostrar as informações do veículo - exibida apenas se não for carro alugado */}
                {!isRentedCar ? (
                  <div className="mt-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">Informações do Veículo</h3>
                      {vehicleInfo && (
                        <button 
                          type="button"
                          onClick={handleClearPlate}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          NÃO É MEU VEÍCULO
                        </button>
                      )}
                    </div>
                    
                    {/* Usar o componente VehicleInfoBox */}
                    <VehicleInfoBox
                      licensePlate={placaValue}
                      onChange={(isValid) => {
                        // Se o veículo é válido, atualizar o estado
                        setVehicleIsValid(isValid);
                        if (isValid) {
                          // O componente já buscará as informações do veículo
                          setIsLoadingVehicleInfo(false);
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                ) : (
                  // Mensagem quando é carro alugado
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-base font-medium text-green-700 mb-1 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Veículo Alugado Registrado
                    </h4>
                    <p className="text-sm text-green-600 ml-7">
                      Você selecionou a opção de veículo alugado. As informações da placa não são necessárias neste momento.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-6 text-base rounded-[3px]"
              disabled={isSubmitting}
              style={{ height: '50px' }}
            >
              {isSubmitting ? 'Processando...' : 'Prosseguir'}
            </Button>
          </form>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <CommentsSection />
      </div>
      
      <Footer />
      
      <LoadingModal
        isOpen={showLoadingModal}
        onComplete={handleLoadingComplete}
        title="Verificando Cadastro"
        loadingSteps={[
          "Verificando dados do CPF",
          "Consultando Carteira de Motorista",
          "Validando documentação do veículo",
          "Analisando disponibilidade na região",
          "Verificando histórico de entregas"
        ]}
        completionMessage="Seus dados foram validados com sucesso! Você está apto a ser um Entregador Parceiro Shopee."
        loadingTime={7000}
      />
    </div>
  );
};

export default Cadastro;