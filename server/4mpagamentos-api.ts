import axios from 'axios';
import crypto from 'crypto';

export interface QuatroMPaymentData {
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone: string;
  amount: number;
  description?: string;
}

export interface QuatroMPixResponse {
  id: string;
  pixCode: string;
  pixQrCode?: string;
  status: string;
  transaction_id: string;
}

export class QuatroMPagamentosAPI {
  private readonly API_URL = "https://app.4mpagamentos.com/api/v1";
  private readonly bearer_token: string;

  constructor() {
    // Usar variável de ambiente segura
    this.bearer_token = process.env.MPAG_API_KEY || '';
    
    if (!this.bearer_token) {
      console.error('[4MPAGAMENTOS] ⚠️ ERRO: MPAG_API_KEY não configurada!');
      throw new Error('MPAG_API_KEY não configurada');
    }
    
    console.log('[4MPAGAMENTOS] API client inicializada com sucesso');
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.bearer_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private generateTransactionId(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const uniqueId = crypto.randomBytes(4).toString('hex');
    return `4MP${timestamp}${uniqueId}`;
  }

  async createPixTransaction(data: QuatroMPaymentData): Promise<QuatroMPixResponse> {
    try {
      console.log('[4MPAGAMENTOS] Iniciando criação de transação PIX...');
      
      // Validar dados obrigatórios
      if (!data.amount || !data.customer_name || !data.customer_cpf) {
        throw new Error('Dados obrigatórios ausentes para 4mpagamentos');
      }

      const transactionId = this.generateTransactionId();

      // Usar CPF real do usuário
      const customerCpf = data.customer_cpf.replace(/[^0-9]/g, '');
      console.log(`[4MPAGAMENTOS] Usando CPF do usuário: ${customerCpf.substring(0, 3)}***${customerCpf.substring(customerCpf.length - 2)}`);

      // Payload conforme documentação 4mpagamentos
      const payload = {
        amount: data.amount.toString(), // API espera string, não number
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_cpf: customerCpf,
        customer_phone: data.customer_phone.replace(/\D/g, ''),
        description: data.description || "Kit de Segurança Shopee Delivery"
      };

      console.log('[4MPAGAMENTOS] Payload preparado:', {
        ...payload,
        customer_cpf: `${customerCpf.substring(0, 3)}***${customerCpf.substring(customerCpf.length - 2)}`
      });

      // Fazer requisição para criar pagamento
      const response = await axios.post(
        `${this.API_URL}/payments`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      if (!response.data) {
        throw new Error('Resposta vazia da API 4mpagamentos');
      }

      const apiResponse = response.data;
      console.log('[4MPAGAMENTOS] Resposta COMPLETA da API:', JSON.stringify(apiResponse, null, 2));
      
      // A resposta vem dentro de "data"
      const responseData = apiResponse.data || apiResponse;
      console.log('[4MPAGAMENTOS] Dados da transação:', {
        transaction_id: responseData.transaction_id,
        status: responseData.status,
        hasPixQrCode: !!responseData.pix_qr_code
      });

      // Montar resposta compatível com a estrutura real da API
      const result: QuatroMPixResponse = {
        id: responseData.transaction_id || transactionId,
        transaction_id: responseData.transaction_id || transactionId,
        pixCode: responseData.pix_code || '',
        pixQrCode: responseData.pix_qr_code || '',
        status: responseData.status || 'pending'
      };

      console.log('[4MPAGAMENTOS] Transação criada com sucesso:', result.transaction_id);
      return result;

    } catch (error: any) {
      console.error('[4MPAGAMENTOS] Erro ao criar transação PIX:', error.message);
      
      if (error.response) {
        console.error('[4MPAGAMENTOS] Detalhes do erro da API:', {
          status: error.response.status,
          data: error.response.data,
          statusText: error.response.statusText
        });
      }

      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Erro desconhecido na API 4mpagamentos'
      );
    }
  }

  async checkTransactionStatus(transactionId: string): Promise<{
    id: string;
    status: string;
    amount?: number;
    customer?: any;
    approvedAt?: string;
    rejectedAt?: string;
  }> {
    try {
      console.log(`[4MPAGAMENTOS] Verificando status da transação: ${transactionId}`);

      const response = await axios.get(
        `${this.API_URL}/payments/${transactionId}`,
        {
          headers: this.getHeaders(),
          timeout: 15000
        }
      );

      const statusData = response.data.data || response.data;
      console.log(`[4MPAGAMENTOS] Status recebido:`, {
        id: statusData.id || transactionId,
        status: statusData.status
      });

      return {
        id: statusData.id || transactionId,
        status: statusData.status || 'pending',
        amount: statusData.amount,
        customer: statusData.customer,
        approvedAt: statusData.status === 'paid' ? new Date().toISOString() : undefined,
        rejectedAt: statusData.status === 'cancelled' || statusData.status === 'expired' ? new Date().toISOString() : undefined
      };

    } catch (error: any) {
      console.error(`[4MPAGAMENTOS] Erro ao verificar status da transação ${transactionId}:`, error.message);
      
      if (error.response) {
        console.error('[4MPAGAMENTOS] Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erro ao verificar status da transação'
      );
    }
  }
}

// Factory function para facilitar import
export function createQuatroMPagamentosAPI(): QuatroMPagamentosAPI {
  return new QuatroMPagamentosAPI();
}