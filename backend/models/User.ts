import mongoose, { Schema, Document } from 'mongoose';

/**
 * Enum de Roles do Usuário
 */
export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  TABLE = 'table',
}

/**
 * Interface do Método de Pagamento
 */
export interface IPaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'pix' | 'cash';
  cardNumber?: string; // Últimos 4 dígitos
  cardHolderName?: string;
  expiryDate?: string;
  brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'discover';
  token?: string; // Token do gateway
  isDefault: boolean;
  createdAt: Date;
}

/**
 * Interface do Documento User do MongoDB
 */
export interface IUser extends Document {
  email?: string;
  password?: string;
  name: string;
  role: UserRole;
  isAnonymous: boolean;
  sessionToken?: string;
  sessionExpiry?: Date;
  paymentMethods?: IPaymentMethod[];
  orderHistory?: mongoose.Types.ObjectId[];
  currentTableId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateSessionToken(): string;
}

/**
 * Schema do PaymentMethod
 */
const PaymentMethodSchema = new Schema<IPaymentMethod>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'pix', 'cash'],
    required: true,
  },
  cardNumber: String,
  cardHolderName: String,
  expiryDate: String,
  brand: {
    type: String,
    enum: ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'discover'],
  },
  token: String,
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

/**
 * Schema do User
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      sparse: true, // Permite múltiplos null (para anônimos)
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Não retorna por padrão
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CLIENT,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    sessionToken: String,
    sessionExpiry: Date,
    paymentMethods: [PaymentMethodSchema],
    orderHistory: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    currentTableId: { type: Schema.Types.ObjectId, ref: 'Table' },
  },
  {
    timestamps: true,
  }
);

/**
 * Índices
 */
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ sessionToken: 1 }, { sparse: true });
UserSchema.index({ sessionExpiry: 1 }, { expireAfterSeconds: 0 }); // TTL index para limpeza automática

/**
 * Middleware: Hash de senha antes de salvar
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const bcrypt = await import('bcrypt');
    const salt = await bcrypt.default.genSalt(10);
    this.password = await bcrypt.default.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Método: Comparar senha
 */
/**
 * Método: Comparar senha
 */
UserSchema.methods['comparePassword'] = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this['password']) return false;
  const bcrypt = await import('bcrypt');
  return bcrypt.default.compare(candidatePassword, this['password']);
};

/**
 * Método: Gerar session token
 */
/**
 * Método: Gerar session token
 */
UserSchema.methods['generateSessionToken'] = function (): string {
  const { v4: uuidv4 } = require('uuid');
  this['sessionToken'] = uuidv4();
  const expiryHours = parseInt(process.env['SESSION_EXPIRY_HOURS'] || '24');
  this['sessionExpiry'] = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return this['sessionToken'];
};

/**
 * Model do User
 */
export const User = mongoose.model<IUser>('User', UserSchema);
