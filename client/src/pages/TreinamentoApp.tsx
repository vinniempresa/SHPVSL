import { FC, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import kitTreinamentoImage from '@assets/a0e45d2fcc7fdab21ea74890cbd0d45e (1).png';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import TreinamentoModal from '../components/TreinamentoModal';

const TreinamentoApp: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const goBack = () => {
    window.history.back();
  };
  
  return (
    <>
      <Helmet>
        <title>Treinamento Shopee</title>
        <meta name="viewport" content="width=375, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
        <style>{`
          body, .sora {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
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
          /* Efeito 3D suave para ícones */
          .icon-3d {
            text-shadow: 
              0px 1px 1px rgba(255,255,255,0.8),
              1px 1px 2px rgba(0,0,0,0.1);
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
            transform: translateY(-0.5px);
            transition: all 0.15s ease;
          }
        `}</style>
      </Helmet>
      
      <div className="bg-[#fafbfc] min-h-screen flex flex-col sora relative" style={{maxWidth:'430px',margin:'0 auto',boxShadow:'0 0 24px 0 rgba(0,0,0,0.08)',height:'100vh'}}>
        {/* Header */}
        <div className="bg-[#f55a1e] w-full h-[48px] fixed top-0 left-1/2 transform -translate-x-1/2 flex items-center justify-between px-4 z-50 sora" style={{maxWidth:'430px'}}>
          <button onClick={goBack} className="text-white text-xl icon-3d">
            <i className="fas fa-arrow-left"></i>
          </button>
          <span className="text-white text-lg font-bold sora">Treinamento Online</span>
          <div className="w-6"></div>
        </div>
        
        {/* Content */}
        <div className="flex-grow pt-16 pb-20 px-4 overflow-y-auto">
          {/* Status de Aprovação */}
          <div className="bg-white shadow-md rounded-0 overflow-hidden mb-6 border border-[#f3f4f6]">
            <div className="bg-[#fff5f0] p-4 border-b border-[#f55a1e20]">
              <h3 className="font-bold text-[#f55a1e] sora">Status do Cadastro</h3>
            </div>
            <div className="p-4">
              <div className="bg-green-50 p-4 rounded-0 border border-green-200 mb-4">
                <div className="flex items-center">
                  <div className="text-green-500 mr-3">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-green-700 sora">Aprovado - Kit de Segurança Confirmado!</h4>
                    <p className="text-sm text-green-600 mt-1" style={{color: '#00000066'}}>Seu cadastro foi aprovado e o pagamento do Kit foi confirmado. Mas o seu Kit só será entregue após você se matricular no Treinamento de Entregadores da Shopee.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                  Sua jornada como Motorista Parceiro Shopee está quase completa! <strong>PARA FINALIZAR O PROCESSO 
                  E LIBERAR SEU ACESSO AO SISTEMA</strong>, você precisa concluir o treinamento online oficial 
                  de 3 horas da Shopee para entregadores. 
                </p>
                <p className="text-sm mt-2 text-red-600 font-bold sora">
                  O treinamento é OBRIGATÓRIO para receber suas credenciais e acessar o aplicativo.
                </p>
              </div>
            </div>
          </div>
          
          {/* Sobre o treinamento */}
          <div className="bg-white shadow-md rounded-0 overflow-hidden mb-6 border border-[#f3f4f6]">
            <div className="bg-[#fff5f0] p-4 border-b border-[#f55a1e20]">
              <h3 className="font-bold text-[#f55a1e] sora">Treinamento Online Shopee - R$97,00</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-4 items-center">
                <div className="w-full">
                  <img 
                    src={kitTreinamentoImage} 
                    alt="Treinamento Shopee" 
                    className="w-full rounded-0 border border-[#f3f4f6]"
                  />
                </div>
                <div className="w-full">
                  <h4 className="text-lg font-bold mb-3 text-[#f55a1e] sora">Curso Online de 3 horas</h4>
                  <p className="text-sm mb-4 sora" style={{color: '#00000066'}}>
                    Este treinamento essencial capacita você com todos os conhecimentos e habilidades 
                    necessários para atuar como um parceiro Shopee de excelência.
                  </p>
                  <div className="bg-red-50 p-4 rounded-0 border border-red-200 mb-4">
                    <h5 className="text-red-700 font-bold text-sm mb-2 sora">⚠️ ATENÇÃO: TREINAMENTO OBRIGATÓRIO</h5>
                    <p className="text-sm text-red-800 sora">
                      Este treinamento é <strong>OBRIGATÓRIO</strong> para começar a trabalhar como Entregador Shopee. 
                      Sem a conclusão do curso online de 3 horas:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-800 sora">
                      <li>Você <strong>NÃO receberá</strong> as credenciais para acessar o aplicativo</li>
                      <li>Seu cadastro ficará <strong>PENDENTE</strong> no sistema</li>
                      <li>Você <strong>NÃO poderá</strong> receber ou realizar entregas</li>
                      <li>Seu kit de segurança será entregue, mas você <strong>NÃO poderá</strong> iniciar suas atividades</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 sora text-sm rounded-0"
                    onClick={() => setModalOpen(true)}
                  >
                    Agendar Treinamento Agora
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo do treinamento */}
          <div className="bg-white shadow-md rounded-0 overflow-hidden mb-6 border border-[#f3f4f6]">
            <div className="bg-[#fff5f0] p-4 border-b border-[#f55a1e20]">
              <h3 className="font-bold text-[#f55a1e] sora">O que você vai aprender</h3>
            </div>
            <div className="p-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-[#f3f4f6]">
                  <AccordionTrigger className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                    Módulo 1: Introdução à Shopee e à sua plataforma de entregas
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sora" style={{color: '#00000066'}}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>História e crescimento da Shopee no Brasil</li>
                      <li>Como funciona o ecossistema de entregas Shopee</li>
                      <li>Benefícios de ser um Motorista Parceiro Shopee</li>
                      <li>Estrutura de ganhos e oportunidades de crescimento</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border-b-[#f3f4f6]">
                  <AccordionTrigger className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                    Módulo 2: Utilizando o aplicativo de entregas Shopee
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sora" style={{color: '#00000066'}}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Download e configuração do aplicativo de entregas</li>
                      <li>Navegação e funcionalidades principais</li>
                      <li>Aceitar, gerenciar e completar entregas</li>
                      <li>Sistema de rotas otimizadas e GPS integrado</li>
                      <li>Resolução de problemas comuns no aplicativo</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border-b-[#f3f4f6]">
                  <AccordionTrigger className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                    Módulo 3: Procedimentos de coleta e entrega
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sora" style={{color: '#00000066'}}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Protocolo de coleta no centro de distribuição Shopee</li>
                      <li>Verificação e confirmação de encomendas</li>
                      <li>Melhores práticas para acondicionamento de pacotes</li>
                      <li>Procedimentos de entrega e validação</li>
                      <li>Lidar com ausência de destinatários</li>
                      <li>Protocolos de devolução quando necessário</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border-b-[#f3f4f6]">
                  <AccordionTrigger className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                    Módulo 4: Segurança e boas práticas
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sora" style={{color: '#00000066'}}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Uso correto do kit de segurança Shopee</li>
                      <li>Prevenção de acidentes durante o transporte</li>
                      <li>Direção defensiva e economia de combustível</li>
                      <li>Manutenção preventiva do veículo</li>
                      <li>Protocolos em caso de emergências</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border-b-[#f3f4f6]">
                  <AccordionTrigger className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                    Módulo 5: Atendimento ao cliente e situações especiais
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sora" style={{color: '#00000066'}}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Etiqueta profissional e representação da marca Shopee</li>
                      <li>Comunicação eficaz com clientes</li>
                      <li>Lidar com situações desafiadoras</li>
                      <li>Política de não-confrontação</li>
                      <li>Protocolo para entregas de alto valor</li>
                      <li>Entregas sensíveis ou que exigem cuidados especiais</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-sm font-medium sora" style={{color: '#000000cc'}}>
                    Módulo 6: Gestão financeira e sistema de pagamentos
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sora" style={{color: '#00000066'}}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Compreendendo seu extrato de ganhos</li>
                      <li>Ciclos de pagamento e processamento</li>
                      <li>Bônus por desempenho e campanhas especiais</li>
                      <li>Dicas para maximizar seus ganhos</li>
                      <li>Questões fiscais para trabalhadores autônomos</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="mt-6 bg-orange-50 p-4 rounded-0 border border-orange-200">
                <h4 className="text-sm font-bold text-orange-700 mb-2 sora">Certificação Shopee para Entregadores</h4>
                <p className="text-orange-700 text-sm mb-2 sora">
                  Ao completar o treinamento, você receberá o Certificado Oficial Shopee para Entregadores, 
                  que é <strong>OBRIGATÓRIO</strong> para:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-orange-700 sora">
                  <li>Receber as credenciais de acesso ao aplicativo Shopee Entregas</li>
                  <li>Ativar seu cadastro como entregador oficial</li>
                  <li>Começar a receber solicitações de entrega na sua região</li>
                  <li>Ter seu primeiro pagamento processado</li>
                </ul>
                <p className="text-orange-700 text-sm mt-2 font-bold sora">
                  Atenção: Sem a conclusão do treinamento de 3 horas, seu acesso ao sistema permanecerá bloqueado.
                </p>
              </div>
            </div>
          </div>
          
          {/* Banner de conclusão */}
          <div className="bg-[#fff5f0] p-4 rounded-0 border border-[#f55a1e20] mb-6">
            <div className="text-center">
              <h3 className="text-[#f55a1e] text-lg font-bold mb-3 sora">Ganhe dinheiro sendo um Motorista Parceiro Shopee</h3>
              <p className="text-sm mb-4 sora" style={{color: '#000000cc'}}>
                Estamos felizes em tê-lo como parte da nossa equipe de entregadores. <strong>Lembre-se:</strong> 
                você precisa concluir este treinamento obrigatório de 3 horas para liberar seu acesso ao aplicativo 
                e começar a receber solicitações de entrega na sua região!
              </p>
              <p className="text-red-600 text-sm font-bold mb-4 sora">
                ATENÇÃO: Sem a conclusão do treinamento, seu cadastro permanecerá pendente e você não poderá
                iniciar suas atividades como entregador Shopee.
              </p>
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 sora text-sm rounded-0"
                onClick={() => setModalOpen(true)}
              >
                Agendar Treinamento Agora
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full bg-white flex justify-between items-center h-[85px] z-50 sora border-t border-[#f3f4f6]" style={{maxWidth:'430px'}}>
          <div className="flex-1 flex flex-col items-center py-1 cursor-pointer sora transition" onClick={() => setLocation('/app')}>
            <i className="fas fa-home text-[#f55a1e] text-2xl"></i>
            <span className="text-[#f55a1e] text-base font-medium mt-1 sora">Início</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-1 cursor-pointer sora transition" onClick={() => setLocation('/app?page=entregas')}>
            <i className="fas fa-box text-[#f55a1e] text-2xl"></i>
            <span className="text-[#f55a1e] text-base font-medium mt-1 sora">Entregas</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-1 cursor-pointer sora transition" onClick={() => setLocation('/app?page=saldo')}>
            <i className="fas fa-wallet text-[#f55a1e] text-2xl"></i>
            <span className="text-[#f55a1e] text-base font-medium mt-1 sora">Saldo</span>
          </div>
        </div>
      </div>
      
      {/* Modal de agendamento do treinamento */}
      <TreinamentoModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};

export default TreinamentoApp;