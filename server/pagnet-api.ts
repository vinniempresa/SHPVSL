import { randomUUID } from 'crypto';

/**
 * API client for Pagnet Brasil PIX transactions
 */
export class PagnetAPI {
  private baseUrl = 'https://api.pagnetbrasil.com/v1';
  private publicKey: string;
  private secretKey: string;
  private authHeader: string;

  constructor() {
    this.publicKey = process.env.PAGNET_PUBLIC_KEY || '';
    this.secretKey = process.env.PAGNET_SECRET_KEY || '';

    if (!this.publicKey || !this.secretKey) {
      console.error('[PAGNET] Chaves de API não encontradas nas variáveis de ambiente');
      throw new Error('PAGNET_PUBLIC_KEY e PAGNET_SECRET_KEY são obrigatórias');
    }

    // Create Basic Auth header
    const authString = `${this.publicKey}:${this.secretKey}`;
    this.authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    console.log('[PAGNET] API client inicializada com sucesso');
  }

  /**
   * Create a PIX transaction using Pagnet API
   */
  async createPixTransaction(customerData: {
    nome: string;
    cpf: string;
    email?: string;
    phone?: string;
  }, amount: number, phone?: string, postbackUrl?: string): Promise<{
    success: boolean;
    transaction_id?: string;
    pix_code?: string;
    amount?: number;
    external_reference?: string;
    raw_response?: any;
    error?: string;
    status_code?: number;
  }> {
    try {
      console.log(`[PAGNET] Iniciando criação de transação PIX - Valor: R$ ${amount}`);

      // Convert amount to cents with proper rounding
      const amountCents = Math.round(parseFloat(amount.toString()) * 100);

      // Prepare customer data
      const customerName = customerData.nome || 'Cliente';
      const customerCpf = customerData.cpf.replace(/[^0-9]/g, '');
      const customerEmail = customerData.email || 'cliente@email.com';
      const customerPhone = (phone || customerData.phone || '11999999999').replace(/[^0-9]/g, '');

      // Generate unique transaction ID
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 19).replace(/[-T:]/g, '');
      const transactionId = `PIX${dateStr}${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

      console.log(`[PAGNET] Dados da transação: Nome=${customerName}, CPF=${customerCpf.slice(0, 3)}***${customerCpf.slice(-2)}, Valor=R$${amount} (${amountCents} centavos)`);

      // Prepare the payload according to Pagnet documentation
      const payload: any = {
        amount: amountCents,
        paymentMethod: 'pix',
        pix: {
          expiresInDays: 3
        },
        items: [
          {
            title: 'Acesso Liberado',
            unitPrice: amountCents,
            quantity: 1,
            tangible: false
          }
        ],
        customer: {
          name: customerName,
          email: customerEmail,
          document: {
            type: 'cpf',
            number: customerCpf
          },
          phone: customerPhone
        },
        externalReference: transactionId
      };

      // Add postback URL if provided
      if (postbackUrl) {
        payload.notificationUrl = postbackUrl;
      }

      console.log(`[PAGNET] Payload preparado:`, {
        ...payload,
        customer: {
          ...payload.customer,
          document: {
            ...payload.customer.document,
            number: customerCpf.slice(0, 3) + '***' + customerCpf.slice(-2)
          }
        }
      });

      // Make API request
      const url = `${this.baseUrl}/transactions`;
      console.log(`[PAGNET] Fazendo requisição para: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`[PAGNET] Status da resposta: ${response.status}`);
      console.log(`[PAGNET] Cabeçalhos da resposta:`, Object.fromEntries(response.headers.entries()));

      if (response.status === 200 || response.status === 201) {
        const responseData = await response.json();
        console.log(`[PAGNET] Resposta da API:`, responseData);

        // Extract PIX data from response
        const pixCode = responseData?.pix?.qrcode || 
                       responseData?.qrCode || 
                       responseData?.qrcode;
        const transactionIdResponse = responseData?.id || 
                                    responseData?.transactionId || 
                                    transactionId;

        if (!pixCode) {
          console.error(`[PAGNET] Código PIX não encontrado na resposta:`, responseData);
          return {
            success: false,
            error: 'Código PIX não foi gerado pela API'
          };
        }

        // Return successful response
        const result = {
          success: true,
          transaction_id: transactionIdResponse,
          pix_code: pixCode,
          amount: amount,
          external_reference: transactionId,
          raw_response: responseData
        };

        console.log(`[PAGNET] ✅ Transação criada com sucesso: ${transactionIdResponse}`);
        return result;

      } else {
        const errorText = await response.text();
        console.error(`[PAGNET] ❌ Erro na API - Status: ${response.status}, Resposta: ${errorText}`);

        let errorMessage = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData?.message || errorText;
        } catch {
          // Keep original error text if not valid JSON
        }

        return {
          success: false,
          error: `Erro da API Pagnet: ${errorMessage}`,
          status_code: response.status
        };
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[PAGNET] ❌ Timeout na requisição');
        return {
          success: false,
          error: 'Timeout na comunicação com a API'
        };
      }

      console.error(`[PAGNET] ❌ Erro inesperado: ${error}`);
      return {
        success: false,
        error: `Erro interno: ${error.message}`
      };
    }
  }

  /**
   * Check the status of a PIX transaction
   */
  async checkTransactionStatus(transactionId: string): Promise<{
    success: boolean;
    status?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const url = `${this.baseUrl}/transactions/${transactionId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json'
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          status: data?.status || 'unknown',
          data: data
        };
      } else {
        return {
          success: false,
          error: `Status code: ${response.status}`
        };
      }

    } catch (error: any) {
      console.error(`[PAGNET] Erro ao verificar status: ${error}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Factory function to create PagnetAPI instance
 */
export function createPagnetAPI(): PagnetAPI {
  return new PagnetAPI();
}