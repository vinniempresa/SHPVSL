import { API_BASE_URL } from './api-config';
import { createPixPaymentDirect } from './for4payments-direct';

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

/**
 * Cria uma solicitação de pagamento PIX através da API For4Payments
 * Esta função escolhe automaticamente a melhor estratégia:
 * 1. Se FOR4PAYMENTS_SECRET_KEY estiver disponível na Netlify - Chama direto a API
 * 2. Caso contrário - Usa o backend no Heroku como intermediário
 */
export async function createPixPayment(data: PaymentRequest): Promise<PaymentResponse> {
  console.log(`Ambiente de execução: ${import.meta.env.PROD ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
  
  // Verificar se a chave da For4Payments está disponível no frontend
  // (Isso acontecerá se a variável estiver configurada no Netlify)
  const hasFor4PaymentKey = !!import.meta.env.VITE_FOR4PAYMENTS_SECRET_KEY;
  
  // Em produção, se tiver a chave, chama diretamente a API For4Payments
  if (import.meta.env.PROD && hasFor4PaymentKey) {
    console.log('Usando chamada direta para For4Payments API');
    
    try {
      // Usar a implementação direta
      return await createPixPaymentDirect(data);
    } catch (error: any) {
      console.error('Falha na chamada direta, tentando via Heroku:', error.message);
      // Em caso de erro, tenta via backend Heroku
    }
  }
  
  // Chamar via backend (sempre usar URL relativa)
  const apiUrl = '/api/proxy/for4payments/pix';
    
  console.log(`URL da API de pagamentos (via Heroku): ${apiUrl}`);
  console.log('Dados de pagamento:', {
    name: data.name,
    cpf: data.cpf.substring(0, 3) + '***' + data.cpf.substring(data.cpf.length - 2),
    email: data.email || 'não informado'
  });
  
  try {
    // Configurar opções de requisição
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: data.name,
        cpf: data.cpf,
        email: data.email || '',
        phone: data.phone || '',
        amount: data.amount || 64.90 // Valor padrão para o kit de segurança
      })
    };
    
    // Fazer a requisição com timeout
    console.log('Enviando requisição para:', apiUrl);
    console.log('Payload:', requestOptions.body);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    const response = await fetch(apiUrl, {
      ...requestOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Resposta recebida, status:', response.status);
    
    // Verificar se a resposta foi bem sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP ${response.status}: ${errorText}`);
      throw new Error(`Falha na comunicação com o servidor: ${response.statusText}`);
    }
    
    // Processar a resposta
    const result = await response.json();
    
    console.log('Resposta do servidor processada:', result);
    
    // Validar a resposta
    if (!result.pixCode || !result.id) {
      console.error('Resposta incompleta:', result);
      throw new Error('A resposta do servidor não contém os dados de pagamento PIX necessários');
    }
    
    console.log('Validação concluída, retornando resultado');
    return result;
  } catch (error: any) {
    console.error('Erro ao processar pagamento:', error);
    throw new Error(error.message || 'Não foi possível processar o pagamento no momento');
  }
}