import mongoose, { Schema, Document } from 'mongoose';

/**
 * Enum de Status da Mesa
 */
export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLOSED = 'closed',
}

/**
 * Interface da Sessão Anônima
 */
export interface IAnonymousSession {
  sessionId: string;
  sessionToken: string;
  joinedAt: Date;
  expiresAt: Date;
  deviceInfo?: string;
}

/**
 * Interface das Informações de Reserva
 */
export interface IReservationInfo {
  clientName: string;
  clientPhone: string;
  dateTime: Date;
  notes?: string;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

/**
 * Interface do Documento Table do MongoDB
 */
export interface ITable extends Document {
  number: number;
  status: TableStatus;
  capacity: number;
  qrCode: string;
  qrCodeImage?: string;
  clients: mongoose.Types.ObjectId[];
  anonymousClients: IAnonymousSession[];
  currentOrders: mongoose.Types.ObjectId[];
  totalConsumption: number;
  openedAt?: Date;
  closedAt?: Date;
  openedBy?: mongoose.Types.ObjectId;
  reservationInfo?: IReservationInfo;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  generateQRCode(): Promise<void>;
}

/**
 * Schema da Sessão Anônima
 */
const AnonymousSessionSchema = new Schema<IAnonymousSession>({
  sessionId: { type: String, required: true },
  sessionToken: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  deviceInfo: String,
});

/**
 * Schema das Informações de Reserva
 */
const ReservationInfoSchema = new Schema<IReservationInfo>({
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  dateTime: { type: Date, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

/**
 * Schema da Mesa
 */
const TableSchema = new Schema<ITable>(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(TableStatus),
      default: TableStatus.AVAILABLE,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    qrCode: {
      type: String,
      required: true,
    },
    qrCodeImage: String,
    clients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    anonymousClients: [AnonymousSessionSchema],
    currentOrders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    totalConsumption: {
      type: Number,
      default: 0,
    },
    openedAt: Date,
    closedAt: Date,
    openedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reservationInfo: ReservationInfoSchema,
  },
  {
    timestamps: true,
  }
);

/**
 * Índices
 */
TableSchema.index({ number: 1 }, { unique: true });
TableSchema.index({ status: 1 });

/**
 * Método: Gerar QR Code
 */
TableSchema.methods.generateQRCode = async function (): Promise<void> {
  const QRCode = await import('qrcode');
  const baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:4200';
  const url = `${baseUrl}/table/${this._id}/join`;

  this.qrCode = url;
  // Gera imagem em base64
  this.qrCodeImage = await QRCode.default.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
};

/**
 * Middleware: Gerar QR Code antes de salvar (primeira vez)
 */
TableSchema.pre('save', async function (next) {
  if (this.isNew && !this.qrCode) {
    await this.generateQRCode();
  }
  next();
});

/**
 * Model da Mesa
 */
export const Table = mongoose.model<ITable>('Table', TableSchema);
