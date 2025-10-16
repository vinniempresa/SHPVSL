import { FC } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Download, BookOpen, Smartphone, CheckCircle } from 'lucide-react';

const Apostila: FC = () => {
  const handleDownloadApostila = () => {
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = '/apostila-entregador-shopee.pdf';
    link.download = 'Apostila-Entregador-Shopee.pdf';
    link.click();
  };

  const handleOpenPlayStore = () => {
    // Link para o app SPX Motorista Parceiro na Play Store
    window.open('https://play.google.com/store/apps/details?id=com.shopee.spx.driver.brazil&pcampaignid=web_share', '_blank');
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        {/* Meia-lua no canto direito */}
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Apostila de Treinamento</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Aviso sobre treinamento */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 shadow-lg rounded-lg overflow-hidden mb-8 border-2 border-[#E83D22]">
            <div className="bg-[#E83D22] p-4">
              <h3 className="font-bold text-white text-xl flex items-center">
                <CheckCircle className="mr-2" size={24} />
                Informação Importante sobre o Treinamento
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-800 text-lg leading-relaxed">
                  Devido à <strong className="text-[#E83D22]">alta demanda de novos entregadores</strong>, 
                  o treinamento presencial está temporariamente suspenso.
                </p>
                
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <p className="text-gray-800 font-semibold mb-2">
                    ✅ Boa notícia! A Shopee disponibilizou uma solução ainda melhor:
                  </p>
                  <p className="text-gray-700">
                    Uma <strong>apostila completa e digital</strong> com todo o conteúdo do treinamento, 
                    onde você aprenderá tudo o que precisa para começar suas entregas com segurança e eficiência!
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <BookOpen className="mr-2" size={20} />
                    O que você encontrará na apostila:
                  </h4>
                  <ul className="text-blue-700 text-sm space-y-1 ml-6">
                    <li>• Introdução à Shopee e plataforma de entregas</li>
                    <li>• Como usar o aplicativo de entregas</li>
                    <li>• Procedimentos de coleta e entrega</li>
                    <li>• Segurança e boas práticas</li>
                    <li>• Atendimento ao cliente</li>
                    <li>• Gestão financeira e pagamentos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de download da apostila */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8 border border-gray-200">
            <div className="bg-gradient-to-r from-[#E83D22] to-[#FF6B4A] p-6">
              <h3 className="font-bold text-white text-2xl text-center flex items-center justify-center">
                <Download className="mr-3" size={28} />
                Baixar Apostila de Treinamento
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 mb-6 text-lg">
                Baixe agora o material completo em PDF e estude no seu próprio ritmo!
              </p>
              <Button 
                onClick={handleDownloadApostila}
                className="bg-[#E83D22] hover:bg-[#D73621] text-white font-bold py-6 px-12 text-lg rounded-lg shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                data-testid="button-download-apostila"
              >
                <Download className="mr-3" size={24} />
                Baixar Apostila (PDF)
              </Button>
            </div>
          </div>

          {/* Instruções do aplicativo */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <h3 className="font-bold text-white text-2xl text-center flex items-center justify-center">
                <Smartphone className="mr-3" size={28} />
                Próximo Passo: Baixar o Aplicativo
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-800 text-lg font-semibold text-center mb-4">
                  Após estudar a apostila, baixe o aplicativo oficial:
                </p>
                
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-500 text-center">
                  <h4 className="font-bold text-green-800 text-xl mb-2">
                    📱 SPX Motorista Parceiro
                  </h4>
                  <p className="text-green-700 mb-4">
                    Disponível na Google Play Store
                  </p>
                  <Button 
                    onClick={handleOpenPlayStore}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 text-lg rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                    data-testid="button-open-playstore"
                  >
                    <Smartphone className="mr-2" size={20} />
                    Abrir na Play Store
                  </Button>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-6">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                    <CheckCircle className="mr-2" size={20} />
                    Após baixar o aplicativo:
                  </h4>
                  <ol className="text-orange-700 text-sm space-y-2 ml-6">
                    <li className="font-medium">1. Realize o cadastro no aplicativo SPX Motorista Parceiro</li>
                    <li className="font-medium">2. Complete seu perfil com as informações solicitadas</li>
                    <li className="font-medium">3. Aguarde a aprovação (geralmente em até 24h)</li>
                    <li className="font-medium">4. Após aprovado, você já pode iniciar suas entregas! 🎉</li>
                  </ol>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                  <p className="text-blue-700 text-sm text-center">
                    💡 <strong>Dica:</strong> Mantenha a apostila salva no seu celular para consultar sempre que precisar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apostila;
