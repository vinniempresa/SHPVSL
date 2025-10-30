import { useState } from 'react';
import CepModal from '@/components/CepModal';
import { useLocation } from 'wouter';

const TesteCep = () => {
  const [showModal, setShowModal] = useState(true);
  const [, navigate] = useLocation();

  const handleConfirm = (cepData: { cep: string, city: string, state: string }) => {
    console.log('CEP confirmado:', cepData);
    localStorage.setItem('shopee_delivery_cep_data', JSON.stringify(cepData));
    alert(`CEP confirmado!\nCEP: ${cepData.cep}\nCidade: ${cepData.city}\nEstado: ${cepData.state}`);
    setShowModal(false);
  };

  const handleClose = () => {
    // Não permitir fechar sem confirmar
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Página de Teste - Modal CEP</h1>
        <p className="text-gray-600 mb-4">Esta é uma página de teste para o modal de CEP.</p>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#E83D22] hover:bg-[#d73920] text-white px-6 py-3 rounded-md w-full mb-4"
        >
          Abrir Modal de CEP
        </button>

        <button
          onClick={() => navigate('/')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-md w-full"
        >
          Voltar para Home
        </button>
      </div>

      <CepModal 
        isOpen={showModal}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default TesteCep;
