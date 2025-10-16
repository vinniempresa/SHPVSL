import axios from 'axios';
import crypto from 'crypto';

export interface MediusPaymentData {
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone: string;
  amount: number;
  description?: string;
}

export interface MediusPixResponse {
  id: string;
  pixCode: string;
  pixQrCode?: string;
  status: string;
}

export class MediusPagAPI {
  private readonly API_URL = "https://api.mediuspag.com/functions/v1";
  private readonly company_id = "30427d55-e437-4384-88de-6ba84fc74833";
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private getHeaders(): Record<string, string> {
    // Create basic auth header: secret_key:x encoded in base64
    const authString = `${this.secretKey}:x`;
    const encodedAuth = Buffer.from(authString).toString('base64');
    
    return {
      'Authorization': `Basic ${encodedAuth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private generateTransactionId(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const uniqueId = crypto.randomBytes(4).toString('hex');
    return `MP${timestamp}${uniqueId}`;
  }

  async createPixTransaction(data: MediusPaymentData): Promise<MediusPixResponse> {
    try {
      console.log('[MEDIUS PAG] Iniciando criação de transação PIX...');
      
      // Validar dados obrigatórios
      if (!data.amount || !data.customer_name || !data.customer_cpf) {
        throw new Error('Dados obrigatórios ausentes para Medius Pag');
      }

      const transactionId = this.generateTransactionId();
      const amountInCents = Math.round(data.amount * 100);

      // Usar CPF real do usuário
      const customerCpf = data.customer_cpf.replace(/[^0-9]/g, '');
      console.log(`[MEDIUS PAG] Usando CPF do usuário: ${customerCpf.substring(0, 3)}***${customerCpf.substring(customerCpf.length - 2)}`);

      // Payload para infoproduto - sem endereço de entrega
      const payload = {
        customer: {
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone.replace(/\D/g, ''),
          document: {
            type: "CPF",
            number: customerCpf
          },
          // Explicitamente não solicitar endereço para produto digital
          addressRequired: false
        },
        paymentMethod: "PIX",
        pix: {
          expiresInDays: 3
        },
        items: [
          {
            title: data.description || 'Kit Digital de Segurança',
            unitPrice: amountInCents,
            quantity: 1,
            externalRef: transactionId,
            tangible: false, // Produto digital
            digital: true    // Marcar explicitamente como digital
          }
        ],
        amount: amountInCents,
        // Configurações específicas para produto digital
        shippingRequired: false,
        digitalProduct: true
      };

      console.log(`[MEDIUS PAG] Enviando transação: ${transactionId}`);
      console.log(`[MEDIUS PAG] Valor: R$ ${data.amount.toFixed(2)}`);
      console.log(`[MEDIUS PAG] Payload:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.API_URL}/transactions`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      console.log(`[MEDIUS PAG] Status da resposta: ${response.status}`);
      console.log(`[MEDIUS PAG] Resposta completa:`, JSON.stringify(response.data, null, 2));

      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        
        // Extrair dados da resposta
        let pixCode = '';
        let pixQrCode = '';
        
        // Buscar PIX code na estrutura aninhada
        if (result.pix && typeof result.pix === 'object') {
          if (result.pix.qrcode) {
            pixCode = result.pix.qrcode;
            console.log(`[MEDIUS PAG] ✅ PIX code encontrado: ${pixCode.substring(0, 50)}...`);
          }
          
          if (result.pix.pixQrCode) {
            pixQrCode = result.pix.pixQrCode;
            console.log(`[MEDIUS PAG] ✅ QR code encontrado`);
          }
        }

        // Buscar na estrutura principal como fallback
        if (!pixCode && result.pixCopyPaste) {
          pixCode = result.pixCopyPaste;
          console.log(`[MEDIUS PAG] ✅ PIX code encontrado na raiz`);
        }
        
        if (!pixQrCode && result.pixQrCode) {
          pixQrCode = result.pixQrCode;
          console.log(`[MEDIUS PAG] ✅ QR code encontrado na raiz`);
        }

        // Se não temos QR code image, gerar usando Google Charts
        if (!pixQrCode && pixCode) {
          pixQrCode = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
          console.log(`[MEDIUS PAG] ✅ QR code gerado via Google Charts`);
        }

        return {
          id: result.id || transactionId,
          pixCode,
          pixQrCode,
          status: result.status || 'pending'
        };
      } else {
        throw new Error(`Erro na API MEDIUS PAG - Status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('[MEDIUS PAG] Erro ao criar transação:', error);
      if (axios.isAxiosError(error)) {
        console.error('[MEDIUS PAG] Resposta de erro:', error.response?.data);
        throw new Error(`Erro na API MEDIUS PAG: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}