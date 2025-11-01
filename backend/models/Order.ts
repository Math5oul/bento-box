import mongoose, { Schema, Document } from 'mongoose';

/**
 * Enum de Status do Pedido
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Interface do Tamanho do Item
 */
export interface IOrderItemSize {
  name: string;
  abbreviation: string;
  price: number;
}

/**
 * Interface do Item do Pedido
 */
export interface IOrderItem {
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  selectedSize?: IOrderItemSize;
}

/**
 * Interface do Documento Order do MongoDB
 */
export interface IOrder extends Document {
  tableId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  sessionToken?: string;
  clientName: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

/**
 * Schema do Item do Pedido
 */
const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  productImage: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  notes: String,
  selectedSize: {
    type: {
      name: { type: String, required: true },
      abbreviation: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
    required: false,
  },
});

/**
 * Schema do Pedido
 */
const OrderSchema = new Schema<IOrder>(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionToken: String,
    clientName: {
      type: String,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Pedido deve ter pelo menos 1 item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    notes: String,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

/**
 * Índices
 */
OrderSchema.index({ tableId: 1, createdAt: -1 });
OrderSchema.index({ clientId: 1 }, { sparse: true });
OrderSchema.index({ sessionToken: 1 }, { sparse: true });
OrderSchema.index({ status: 1 });

/**
 * Validação: Deve ter clientId OU sessionToken
 */
OrderSchema.pre('validate', function (next) {
  if (!this.clientId && !this.sessionToken) {
    next(new Error('Pedido deve ter clientId ou sessionToken'));
  } else {
    next();
  }
});

/**
 * Middleware: Calcular totalAmount automaticamente
 */
OrderSchema.pre('save', function (next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  next();
});

/**
 * Model do Pedido
 */
export const Order = mongoose.model<IOrder>('Order', OrderSchema);
