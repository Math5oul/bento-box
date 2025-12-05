import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface para categorias de relatório
 * Categorias personalizadas para organização de relatórios fiscais
 */
export interface IReportCategory extends Document {
  name: string;
  description?: string;
  color?: string;
  productIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ReportCategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // blue-500
      match: /^#[0-9A-F]{6}$/i,
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índices para melhor performance
ReportCategorySchema.index({ name: 1 });
ReportCategorySchema.index({ productIds: 1 });

export const ReportCategory = mongoose.model<IReportCategory>(
  'ReportCategory',
  ReportCategorySchema
);
