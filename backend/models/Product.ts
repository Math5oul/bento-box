import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface do Produto
 */
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  images: string[];
  category:
    | 'food'
    | 'hot beverage'
    | 'cold beverage'
    | 'dessert'
    | 'alcoholic'
    | 'beverage'
    | 'other';
  format?: '1x1' | '1x2' | '2x1' | '2x2';
  colorMode?: 'light' | 'dark';
  available: boolean;
  gridPosition?: {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema do Produto
 */
const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do produto é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome não pode ter mais de 100 caracteres'],
    },
    description: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
      maxlength: [500, 'Descrição não pode ter mais de 500 caracteres'],
    },
    price: {
      type: Number,
      required: [true, 'Preço é obrigatório'],
      min: [0, 'Preço não pode ser negativo'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 5;
        },
        message: 'Máximo de 5 imagens por produto',
      },
    },
    category: {
      type: String,
      enum: ['food', 'hot beverage', 'cold beverage', 'dessert', 'alcoholic', 'beverage', 'other'],
      default: 'other',
    },
    format: {
      type: String,
      enum: ['1x1', '1x2', '2x1', '2x2'],
      default: '1x1',
    },
    colorMode: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    available: {
      type: Boolean,
      default: true,
    },
    gridPosition: {
      row: { type: Number },
      col: { type: Number },
      rowSpan: { type: Number, default: 1 },
      colSpan: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar performance
ProductSchema.index({ category: 1, available: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
