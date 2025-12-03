import axios from 'axios';

export interface POSConfig {
  terminalType:
    | 'stone'
    | 'pagseguro_moderninha'
    | 'mercadopago_point'
    | 'cielo_lio'
    | 'getnet'
    | 'none';
  connectionType: 'wifi' | 'bluetooth' | 'usb';
  ipAddress: string;
  port: number;
  deviceId: string;
  stoneCode: string;
  serialNumber: string;
  autoConfirm: boolean;
}

export interface POSPaymentRequest {
  amount: number; // Valor em centavos
  description: string;
  billId: string;
  paymentType: 'credit' | 'debit' | 'pix';
}

export interface POSPaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  receiptText?: string;
  approved?: boolean;
  error?: string;
}

/**
 * Serviço de POS Terminal - Abstração para múltiplas maquininhas
 */
export class POSTerminalService {
  private config: POSConfig;

  constructor(config: POSConfig) {
    this.config = config;
  }

  /**
   * Testa conexão com o terminal
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      switch (this.config.terminalType) {
        case 'stone':
          return await this.testStone();
        case 'pagseguro_moderninha':
          return await this.testPagSeguroModerninha();
        case 'mercadopago_point':
          return await this.testMercadoPagoPoint();
        case 'cielo_lio':
          return await this.testCieloLIO();
        case 'getnet':
          return await this.testGetNet();
        default:
          return { success: false, message: 'Terminal não configurado' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Envia pagamento para o terminal
   */
  async sendPayment(payment: POSPaymentRequest): Promise<POSPaymentResult> {
    try {
      switch (this.config.terminalType) {
        case 'stone':
          return await this.sendPaymentStone(payment);
        case 'pagseguro_moderninha':
          return await this.sendPaymentPagSeguro(payment);
        case 'mercadopago_point':
          return await this.sendPaymentMercadoPagoPoint(payment);
        case 'cielo_lio':
          return await this.sendPaymentCieloLIO(payment);
        case 'getnet':
          return await this.sendPaymentGetNet(payment);
        default:
          return {
            success: false,
            message: 'Terminal não configurado',
            approved: false,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        approved: false,
        error: error.message,
      };
    }
  }

  /**
   * Verifica status de um pagamento
   */
  async checkPaymentStatus(transactionId: string): Promise<POSPaymentResult> {
    try {
      switch (this.config.terminalType) {
        case 'stone':
          return await this.checkStatusStone(transactionId);
        case 'pagseguro_moderninha':
          return await this.checkStatusPagSeguro(transactionId);
        case 'mercadopago_point':
          return await this.checkStatusMercadoPagoPoint(transactionId);
        case 'cielo_lio':
          return await this.checkStatusCieloLIO(transactionId);
        case 'getnet':
          return await this.checkStatusGetNet(transactionId);
        default:
          return {
            success: false,
            message: 'Terminal não configurado',
            approved: false,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        approved: false,
      };
    }
  }

  // ==================== STONE ====================

  private async testStone(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.connectionType === 'wifi') {
        // Teste de ping HTTP na maquininha Stone
        const url = `http://${this.config.ipAddress}:${this.config.port}/api/status`;
        const response = await axios.get(url, { timeout: 5000 });

        if (response.status === 200) {
          return {
            success: true,
            message: `Stone conectada! IP: ${this.config.ipAddress}`,
          };
        }
      }

      return {
        success: true,
        message: 'Configuração salva. Certifique-se que a maquininha está ligada e na mesma rede.',
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: `Não foi possível conectar em ${this.config.ipAddress}:${this.config.port}. Verifique se a maquininha está ligada e na mesma rede.`,
        };
      }
      return { success: false, message: `Erro: ${error.message}` };
    }
  }

  private async sendPaymentStone(payment: POSPaymentRequest): Promise<POSPaymentResult> {
    try {
      const url = `http://${this.config.ipAddress}:${this.config.port}/api/transaction`;

      const requestData = {
        amount: payment.amount,
        type: payment.paymentType,
        installments: payment.paymentType === 'credit' ? 1 : undefined,
        stone_code: this.config.stoneCode,
        reference: payment.billId,
      };

      const response = await axios.post(url, requestData, {
        timeout: 120000, // 2 minutos para o cliente passar o cartão
      });

      if (response.data.approved) {
        return {
          success: true,
          message: 'Pagamento aprovado na Stone!',
          transactionId: response.data.transaction_id || response.data.atk,
          receiptText: response.data.receipt,
          approved: true,
        };
      } else {
        return {
          success: false,
          message: response.data.reason || 'Pagamento recusado',
          approved: false,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao processar pagamento: ${error.message}`,
        approved: false,
        error: error.message,
      };
    }
  }

  private async checkStatusStone(transactionId: string): Promise<POSPaymentResult> {
    try {
      const url = `http://${this.config.ipAddress}:${this.config.port}/api/transaction/${transactionId}`;
      const response = await axios.get(url, { timeout: 5000 });

      return {
        success: true,
        message: 'Status obtido com sucesso',
        transactionId: transactionId,
        approved: response.data.approved || false,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao verificar status: ${error.message}`,
        approved: false,
      };
    }
  }

  // ==================== PAGSEGURO MODERNINHA ====================

  private async testPagSeguroModerninha(): Promise<{ success: boolean; message: string }> {
    // PagSeguro Moderninha geralmente usa SDK Android/iOS via Bluetooth
    // Para versão WiFi (Moderninha Smart/Pro):
    return {
      success: true,
      message:
        'PagSeguro Moderninha configurada. Use o SDK móvel para integração via Bluetooth ou teste conexão WiFi.',
    };
  }

  private async sendPaymentPagSeguro(payment: POSPaymentRequest): Promise<POSPaymentResult> {
    // Implementação via SDK ou API local da Moderninha Smart
    // Este é um exemplo simplificado
    return {
      success: false,
      message: 'PagSeguro Moderninha requer SDK específico. Implementação pendente.',
      approved: false,
    };
  }

  private async checkStatusPagSeguro(transactionId: string): Promise<POSPaymentResult> {
    return {
      success: false,
      message: 'PagSeguro status check não implementado ainda',
      approved: false,
    };
  }

  // ==================== MERCADO PAGO POINT ====================

  private async testMercadoPagoPoint(): Promise<{ success: boolean; message: string }> {
    // Mercado Pago Point usa SDK móvel (Android/iOS)
    return {
      success: true,
      message: 'Mercado Pago Point configurado. Requer SDK móvel para comunicação Bluetooth.',
    };
  }

  private async sendPaymentMercadoPagoPoint(payment: POSPaymentRequest): Promise<POSPaymentResult> {
    // Implementação via SDK do Mercado Pago Point
    return {
      success: false,
      message: 'Mercado Pago Point requer SDK móvel. Implementação pendente.',
      approved: false,
    };
  }

  private async checkStatusMercadoPagoPoint(transactionId: string): Promise<POSPaymentResult> {
    return {
      success: false,
      message: 'MP Point status check não implementado ainda',
      approved: false,
    };
  }

  // ==================== CIELO LIO ====================

  private async testCieloLIO(): Promise<{ success: boolean; message: string }> {
    // Cielo LIO é um terminal Android com apps customizados
    return {
      success: true,
      message: 'Cielo LIO configurado. Requer app Android customizado instalado no terminal.',
    };
  }

  private async sendPaymentCieloLIO(payment: POSPaymentRequest): Promise<POSPaymentResult> {
    // Implementação via Order Manager API da Cielo LIO
    return {
      success: false,
      message: 'Cielo LIO requer Order Manager API. Implementação pendente.',
      approved: false,
    };
  }

  private async checkStatusCieloLIO(transactionId: string): Promise<POSPaymentResult> {
    return {
      success: false,
      message: 'Cielo LIO status check não implementado ainda',
      approved: false,
    };
  }

  // ==================== GETNET ====================

  private async testGetNet(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'GetNet configurada. Aguardando documentação de API local.',
    };
  }

  private async sendPaymentGetNet(payment: POSPaymentRequest): Promise<POSPaymentResult> {
    return {
      success: false,
      message: 'GetNet implementação pendente',
      approved: false,
    };
  }

  private async checkStatusGetNet(transactionId: string): Promise<POSPaymentResult> {
    return {
      success: false,
      message: 'GetNet status check não implementado ainda',
      approved: false,
    };
  }
}

/**
 * Factory function para criar instância do serviço a partir do .env
 */
export function createPOSTerminalService(): POSTerminalService | null {
  const enabled = process.env['POS_ENABLED'] === 'true';

  if (!enabled) {
    return null;
  }

  const config: POSConfig = {
    terminalType: (process.env['POS_TERMINAL_TYPE'] as POSConfig['terminalType']) || 'none',
    connectionType: (process.env['POS_CONNECTION_TYPE'] as POSConfig['connectionType']) || 'wifi',
    ipAddress: process.env['POS_IP_ADDRESS'] || '',
    port: parseInt(process.env['POS_PORT'] || '8080'),
    deviceId: process.env['POS_DEVICE_ID'] || '',
    stoneCode: process.env['POS_STONE_CODE'] || '',
    serialNumber: process.env['POS_SERIAL_NUMBER'] || '',
    autoConfirm: process.env['POS_AUTO_CONFIRM'] === 'true',
  };

  return new POSTerminalService(config);
}
