import mongoose, { Schema, Document } from 'mongoose';

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
export interface IBillItemDiscount {
  type: DiscountType;
  value: number; // Porcentagem (0-100) ou valor fixo
  description?: string;
}

/**
 * Interface de Item da Bill
 */
export interface IBillItem {
  orderId: mongoose.Types.ObjectId; // Referência ao pedido original
  orderItemId?: string; // ID do item no pedido (para rastreamento)
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number; // Quantidade que está sendo paga
  originalQuantity: number; // Quantidade original do pedido
  unitPrice: number;
  subtotal: number; // quantity * unitPrice
  discount?: IBillItemDiscount;
  finalPrice: number; // Preço após desconto
  isSplit: boolean; // Se é um item dividido
  splitIndex?: number; // Índice da divisão (1, 2, 3...)
  totalSplits?: number; // Total de divisões do item
}

/**
 * Interface de dados de pagamento online
 */
export interface IPaymentData {
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
 * Interface do Documento Bill do MongoDB
 */
export interface IBill extends Document {
  tableId: mongoose.Types.ObjectId;
  tableNumber: number;
  orderIds: mongoose.Types.ObjectId[]; // Pedidos incluídos nesta bill
  items: IBillItem[];
  subtotal: number; // Soma dos subtotais dos itens
  totalDiscount: number; // Soma total dos descontos
  finalTotal: number; // Total após descontos
  paymentMethod?: PaymentMethod;
  status: BillStatus;
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId; // Usuário que fez o pagamento (se houver)
  notes?: string;
  // Campos para pagamento online
  paymentData?: IPaymentData;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Desconto de Item
 */
const BillItemDiscountSchema = new Schema<IBillItemDiscount>(
  {
    type: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 200,
    },
  },
  { _id: false }
);

/**
 * Schema de Item da Bill
 */
const BillItemSchema = new Schema<IBillItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderItemId: {
      type: String,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    originalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: BillItemDiscountSchema,
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isSplit: {
      type: Boolean,
      default: false,
    },
    splitIndex: {
      type: Number,
      min: 1,
    },
    totalSplits: {
      type: Number,
      min: 2,
    },
  },
  { _id: false }
);

/**
 * Schema da Bill
 */
const BillSchema: Schema = new Schema(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    orderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    items: {
      type: [BillItemSchema],
      required: true,
      validate: {
        validator: function (items: IBillItem[]) {
          return items.length > 0;
        },
        message: 'Bill deve conter pelo menos um item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    status: {
      type: String,
      enum: Object.values(BillStatus),
      default: BillStatus.PENDING,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    paymentData: {
      provider: {
        type: String,
        enum: ['mercadopago', 'stripe', 'pagseguro', 'asaas'],
      },
      transactionId: String,
      paymentId: String,
      qrCode: String,
      qrCodeText: String,
      paymentUrl: String,
      expiresAt: Date,
      webhookReceived: {
        type: Boolean,
        default: false,
      },
      webhookData: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries eficientes
BillSchema.index({ tableId: 1, status: 1 });
BillSchema.index({ createdAt: -1 });

// Middleware para calcular totais antes de salvar
BillSchema.pre('save', function (next) {
  const items = this.get('items') as IBillItem[];

  if (items && items.length > 0) {
    // Calcular subtotal
    this.set(
      'subtotal',
      items.reduce((sum: number, item: IBillItem) => sum + item.subtotal, 0)
    );

    // Calcular desconto total
    this.set(
      'totalDiscount',
      items.reduce((sum: number, item: IBillItem) => sum + (item.subtotal - item.finalPrice), 0)
    );

    // Calcular total final
    this.set(
      'finalTotal',
      items.reduce((sum: number, item: IBillItem) => sum + item.finalPrice, 0)
    );
  }

  next();
});

export const Bill = mongoose.model<IBill>('Bill', BillSchema);
