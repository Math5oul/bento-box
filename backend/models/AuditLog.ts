import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  action: string; // 'EXPORT_REPORT', 'CREATE_USER', 'DELETE_PRODUCT', etc.
  resource: string; // 'reports', 'users', 'products', 'roles'
  resourceId?: string; // ID do recurso afetado
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>; // Dados adicionais (filtros de relatório, etc.)
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        // Relatórios
        'EXPORT_SALES_REPORT',
        'EXPORT_CATEGORY_REPORT',
        'VIEW_REPORT',
        // Usuários
        'CREATE_USER',
        'UPDATE_USER',
        'DELETE_USER',
        'CHANGE_PASSWORD',
        // Roles
        'CREATE_ROLE',
        'UPDATE_ROLE',
        'DELETE_ROLE',
        'UPDATE_PERMISSIONS',
        // Produtos
        'CREATE_PRODUCT',
        'UPDATE_PRODUCT',
        'DELETE_PRODUCT',
        'UPDATE_PRODUCT_PRICE',
        // Categorias
        'CREATE_CATEGORY',
        'UPDATE_CATEGORY',
        'DELETE_CATEGORY',
        'UPDATE_DISCOUNTS',
        // Sistema
        'LOGIN',
        'LOGOUT',
        'FAILED_LOGIN',
        'BACKUP_DATABASE',
        'RESTORE_DATABASE',
        'SYSTEM_ERROR',
      ],
    },
    resource: {
      type: String,
      required: true,
      index: true,
      enum: ['reports', 'users', 'roles', 'products', 'categories', 'auth', 'system'],
    },
    resourceId: {
      type: String,
      required: false,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: false, // Usamos timestamp customizado
  }
);

// Índices compostos para queries frequentes
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, timestamp: -1 });

// TTL - Remove logs com mais de 90 dias automaticamente
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
