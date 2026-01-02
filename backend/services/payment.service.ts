import axios from 'axios';

export interface PaymentConfig {
  provider: 'mercado_pago' | 'stripe' | 'pagseguro' | 'asaas' | 'none';
  publicKey: string;
  accessToken: string;
  pixEnabled: boolean;
  creditCardEnabled: boolean;
  debitCardEnabled: boolean;
  webhookUrl: string;
}

export interface PaymentResult {
  success: boolean;
  message?: string;
  provider?: string;
  transactionId?: string;
  paymentId?: string;
  paymentUrl?: string;
  qrCode?: string;
  qrCodeText?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Serviço de Pagamento - Abstração para múltiplos gateways
 */
export class PaymentService {
  private config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  /**
   * Testa conexão com o gateway de pagamento
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      switch (this.config.provider) {
        case 'mercado_pago':
          return await this.testMercadoPago();
        case 'stripe':
          return await this.testStripe();
        case 'pagseguro':
          return await this.testPagSeguro();
        case 'asaas':
          return await this.testAsaas();
        default:
          return { success: false, message: 'Provider não configurado' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(
    amount: number,
    description: string,
    customerEmail: string
  ): Promise<PaymentResult> {
    if (!this.config.pixEnabled) {
      return { success: false, error: 'PIX não está habilitado' };
    }

    try {
      switch (this.config.provider) {
        case 'mercado_pago':
          return await this.createMercadoPagoPix(amount, description, customerEmail);
        case 'asaas':
          return await this.createAsaasPix(amount, description, customerEmail);
        default:
          return { success: false, error: 'Provider não suporta PIX' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria um pagamento com cartão
   */
  async createCardPayment(
    amount: number,
    description: string,
    cardToken: string,
    customerEmail: string
  ): Promise<PaymentResult> {
    if (!this.config.creditCardEnabled && !this.config.debitCardEnabled) {
      return { success: false, error: 'Pagamento com cartão não está habilitado' };
    }

    try {
      switch (this.config.provider) {
        case 'mercado_pago':
          return await this.createMercadoPagoCard(amount, description, cardToken, customerEmail);
        case 'stripe':
          return await this.createStripeCard(amount, description, cardToken, customerEmail);
        case 'pagseguro':
          return await this.createPagSeguroCard(amount, description, cardToken, customerEmail);
        case 'asaas':
          return await this.createAsaasCard(amount, description, cardToken, customerEmail);
        default:
          return { success: false, error: 'Provider não configurado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============ MERCADO PAGO ============

  private async testMercadoPago(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      });

      if (response.status === 200) {
        return { success: true, message: 'Conexão com Mercado Pago OK' };
      }
      return { success: false, message: 'Erro ao conectar com Mercado Pago' };
    } catch (error: any) {
      return { success: false, message: `Erro: ${error.response?.data?.message || error.message}` };
    }
  }

  private async createMercadoPagoPix(
    amount: number,
    description: string,
    email: string
  ): Promise<PaymentResult> {
    const response = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      transactionId: response.data.id,
      qrCode: response.data.point_of_interaction?.transaction_data?.qr_code,
      paymentUrl: response.data.point_of_interaction?.transaction_data?.ticket_url,
    };
  }

  private async createMercadoPagoCard(
    amount: number,
    description: string,
    token: string,
    email: string
  ): Promise<PaymentResult> {
    const response = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: amount,
        description: description,
        token: token,
        installments: 1,
        payment_method_id: 'visa', // Detectar dinamicamente
        payer: {
          email: email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      transactionId: response.data.id,
    };
  }

  // ============ STRIPE ============

  private async testStripe(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://api.stripe.com/v1/payment_methods', {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      });

      if (response.status === 200) {
        return { success: true, message: 'Conexão com Stripe OK' };
      }
      return { success: false, message: 'Erro ao conectar com Stripe' };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro: ${error.response?.data?.error?.message || error.message}`,
      };
    }
  }

  private async createStripeCard(
    amount: number,
    description: string,
    token: string,
    email: string
  ): Promise<PaymentResult> {
    const response = await axios.post(
      'https://api.stripe.com/v1/payment_intents',
      new URLSearchParams({
        amount: (amount * 100).toString(), // Stripe usa centavos
        currency: 'brl',
        description: description,
        payment_method: token,
        confirm: 'true',
        receipt_email: email,
      }),
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      success: true,
      transactionId: response.data.id,
    };
  }

  // ============ PAGSEGURO ============

  private async testPagSeguro(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://ws.pagseguro.uol.com.br/v2/sessions', {
        params: {
          email: this.config.publicKey,
          token: this.config.accessToken,
        },
      });

      if (response.status === 200) {
        return { success: true, message: 'Conexão com PagSeguro OK' };
      }
      return { success: false, message: 'Erro ao conectar com PagSeguro' };
    } catch (error: any) {
      return { success: false, message: `Erro: ${error.message}` };
    }
  }

  private async createPagSeguroCard(
    amount: number,
    description: string,
    token: string,
    email: string
  ): Promise<PaymentResult> {
    // Implementação do PagSeguro
    // API v4: https://dev.pagseguro.uol.com.br/reference/criar-pedido
    const response = await axios.post(
      'https://api.pagseguro.com/orders',
      {
        reference_id: `order-${Date.now()}`,
        customer: {
          email: email,
        },
        items: [
          {
            name: description,
            quantity: 1,
            unit_amount: Math.round(amount * 100), // PagSeguro usa centavos
          },
        ],
        charges: [
          {
            reference_id: `charge-${Date.now()}`,
            description: description,
            amount: {
              value: Math.round(amount * 100),
              currency: 'BRL',
            },
            payment_method: {
              type: 'CREDIT_CARD',
              card: {
                encrypted: token,
              },
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      transactionId: response.data.id,
    };
  }

  // ============ ASAAS ============

  private async testAsaas(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://www.asaas.com/api/v3/customers', {
        headers: {
          access_token: this.config.accessToken,
        },
        params: {
          limit: 1,
        },
      });

      if (response.status === 200) {
        return { success: true, message: 'Conexão com Asaas OK' };
      }
      return { success: false, message: 'Erro ao conectar com Asaas' };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro: ${error.response?.data?.errors?.[0]?.description || error.message}`,
      };
    }
  }

  private async createAsaasPix(
    amount: number,
    description: string,
    email: string
  ): Promise<PaymentResult> {
    // Primeiro cria ou busca cliente
    const customerResponse = await axios.post(
      'https://www.asaas.com/api/v3/customers',
      {
        name: 'Cliente',
        email: email,
      },
      {
        headers: {
          access_token: this.config.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Cria cobrança PIX
    const response = await axios.post(
      'https://www.asaas.com/api/v3/payments',
      {
        customer: customerResponse.data.id,
        billingType: 'PIX',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0],
        description: description,
      },
      {
        headers: {
          access_token: this.config.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Busca QR Code do PIX
    const qrCodeResponse = await axios.get(
      `https://www.asaas.com/api/v3/payments/${response.data.id}/pixQrCode`,
      {
        headers: {
          access_token: this.config.accessToken,
        },
      }
    );

    return {
      success: true,
      transactionId: response.data.id,
      qrCode: qrCodeResponse.data.payload,
      paymentUrl: response.data.invoiceUrl,
    };
  }

  private async createAsaasCard(
    amount: number,
    description: string,
    token: string,
    email: string
  ): Promise<PaymentResult> {
    // Primeiro cria ou busca cliente
    const customerResponse = await axios.post(
      'https://www.asaas.com/api/v3/customers',
      {
        name: 'Cliente',
        email: email,
      },
      {
        headers: {
          access_token: this.config.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Cria cobrança com cartão
    const response = await axios.post(
      'https://www.asaas.com/api/v3/payments',
      {
        customer: customerResponse.data.id,
        billingType: 'CREDIT_CARD',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0],
        description: description,
        creditCard: {
          holderName: 'Cliente',
          number: token, // Token do cartão
          expiryMonth: '12',
          expiryYear: '2025',
          ccv: '123',
        },
        creditCardHolderInfo: {
          name: 'Cliente',
          email: email,
          cpfCnpj: '00000000000',
          postalCode: '00000000',
          addressNumber: '0',
        },
      },
      {
        headers: {
          access_token: this.config.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      transactionId: response.data.id,
    };
  }
}

/**
 * Factory para criar instância do PaymentService baseado no .env
 */
export function createPaymentService(): PaymentService | null {
  const provider = (process.env['PAYMENT_PROVIDER'] as PaymentConfig['provider']) || 'none';

  if (provider === 'none') {
    return null;
  }

  const config: PaymentConfig = {
    provider,
    publicKey: process.env['MERCADOPAGO_PUBLIC_KEY'] || '',
    accessToken: process.env['MERCADOPAGO_ACCESS_TOKEN'] || '',
    pixEnabled: process.env['PAYMENT_PIX_ENABLED'] === 'true',
    creditCardEnabled: process.env['PAYMENT_CREDIT_CARD_ENABLED'] === 'true',
    debitCardEnabled: process.env['PAYMENT_DEBIT_CARD_ENABLED'] === 'true',
    webhookUrl: process.env['PAYMENT_WEBHOOK_URL'] || '',
  };

  return new PaymentService(config);
}
