/**
 * Enums para Bill
 */
export enum BillStatus {
  PENDING = 'pending',
  PENDING_PAYMENT = 'pending_payment', // Aguardando pagamento online
  PROCESSING = 'processing', // Processando pagamento
  PAID = 'paid',
  CANCELLED = 'cancelled',
  FAILED = 'failed', // Pagamento falhou
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  ONLINE_CREDIT = 'online_credit', // Cartão online via gateway
  ONLINE_DEBIT = 'online_debit', // Débito online via gateway
  ONLINE_PIX = 'online_pix', // PIX via gateway
  OTHER = 'other',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

/**
 * Interface de Desconto em Item
 */
export interface BillItemDiscount {
  type: DiscountType;
  value: number; // Porcentagem (0-100) ou valor fixo
  description?: string;
}

/**
 * Interface de Item da Bill
 */
export interface BillItem {
  orderId: string; // Referência ao pedido original
  orderItemId?: string; // ID do item no pedido (para rastreamento)
  productId: string;
  productName: string;
  quantity: number; // Quantidade que está sendo paga
  originalQuantity: number; // Quantidade original do pedido
  unitPrice: number;
  subtotal: number; // quantity * unitPrice
  discount?: BillItemDiscount;
  finalPrice: number; // Preço após desconto
  isSplit: boolean; // Se é um item dividido
  splitIndex?: number; // Índice da divisão (1, 2, 3...)
  totalSplits?: number; // Total de divisões do item
}

/**
 * Interface de dados de pagamento online
 */
export interface PaymentData {
  provider?: string; // mercadopago, stripe, pagseguro, asaas
  transactionId?: string; // ID da transação no gateway
  paymentId?: string; // ID do pagamento no gateway
  qrCode?: string; // QR Code PIX (base64 ou URL)
  qrCodeText?: string; // Código PIX copia e cola
  paymentUrl?: string; // URL de pagamento (cartão)
  expiresAt?: Date; // Data de expiração do pagamento
  webhookReceived?: boolean; // Se recebeu callback do gateway
  webhookData?: any; // Dados do webhook
}

/**
 * Interface da Bill
 */
export interface Bill {
  _id: string;
  tableId: string;
  tableNumber: number;
  orderIds: string[]; // Pedidos incluídos nesta bill
  items: BillItem[];
  subtotal: number; // Soma dos subtotais dos itens
  totalDiscount: number; // Soma total dos descontos
  finalTotal: number; // Total após descontos
  paymentMethod?: PaymentMethod;
  status: BillStatus;
  paidAt?: Date;
  paidBy?: string; // Usuário que fez o pagamento
  notes?: string;
  // Campos para pagamento online
  paymentData?: PaymentData;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para criar uma Bill
 */
export interface CreateBillDTO {
  tableId: string;
  tableNumber: number;
  orderIds: string[];
  items: BillItem[];
  subtotal: number;
  finalTotal: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

/**
 * DTO para atualizar status da Bill
 */
export interface UpdateBillStatusDTO {
  status: BillStatus;
  paymentMethod?: PaymentMethod;
}

/**
 * Interface de Resumo de Bills de uma Mesa
 */
export interface BillSummary {
  totalBills: number;
  totalPaid: number;
  totalPending: number;
  paidBills: number;
  pendingBills: number;
}

/**
 * Labels para exibição
 */
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.ONLINE_CREDIT]: 'Cartão de Crédito Online',
  [PaymentMethod.ONLINE_DEBIT]: 'Cartão de Débito Online',
  [PaymentMethod.ONLINE_PIX]: 'PIX Online',
  [PaymentMethod.OTHER]: 'Outro',
};

export const BillStatusLabels: Record<BillStatus, string> = {
  [BillStatus.PENDING]: 'Pendente',
  [BillStatus.PENDING_PAYMENT]: 'Aguardando Pagamento',
  [BillStatus.PROCESSING]: 'Processando',
  [BillStatus.PAID]: 'Pago',
  [BillStatus.CANCELLED]: 'Cancelado',
  [BillStatus.FAILED]: 'Falhou',
};

export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Percentual (%)',
  [DiscountType.FIXED]: 'Valor Fixo (R$)',
};
