/**
 * Enums para Bill
 */
export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
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
  [PaymentMethod.OTHER]: 'Outro',
};

export const BillStatusLabels: Record<BillStatus, string> = {
  [BillStatus.PENDING]: 'Pendente',
  [BillStatus.PAID]: 'Pago',
  [BillStatus.CANCELLED]: 'Cancelado',
};

export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Percentual (%)',
  [DiscountType.FIXED]: 'Valor Fixo (R$)',
};
