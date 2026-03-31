import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface de Desconto por Role de Usuário
 */
export interface ICategoryDiscount {
  roleId: mongoose.Types.ObjectId; // ID do role
  discountPercent: number; // 0-100
}

/**
 * Interface do Documento Category do MongoDB
 */
export interface ICategory extends Document {
  name: string;
  emoji: string;
  slug: string;
  index?: number;
  showInMenu?: boolean; // Se true, aparece no cardápio público (Bento Box). Se false, apenas admin pode adicionar
  discounts?: ICategoryDiscount[]; // Descontos por nível de cliente
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Desconto por Role de Usuário
 */
const DiscountSchema = new Schema<ICategoryDiscount>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: [0, 'Desconto não pode ser negativo'],
      max: [100, 'Desconto não pode ser maior que 100%'],
    },
  },
  { _id: false }
);

/**
 * Schema da Categoria
 */
const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da categoria é obrigatório'],
      trim: true,
      maxlength: [50, 'Nome não pode ter mais de 50 caracteres'],
    },
    emoji: {
      type: String,
      required: [true, 'Emoji é obrigatório'],
      default: '📦',
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [50, 'Slug não pode ter mais de 50 caracteres'],
    },
    index: {
      type: Number,
      required: false,
      default: 0,
      index: true,
    },
    showInMenu: {
      type: Boolean,
      required: false,
      default: true, // Por padrão, categorias aparecem no menu
      index: true,
    },
    discounts: {
      type: [DiscountSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    // Força uso de UTF-8
    collection: 'categories',
  }
);

/**
 * Índices
 */
CategorySchema.index({ name: 1 });

/**
 * Middleware: Gerar slug automaticamente antes de salvar
 */
CategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this['slug']) {
    const name = this['name'] as string;
    this['slug'] = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços viram hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  }
  next();
});

/**
 * Model da Categoria
 */
const CategoryModel = mongoose.model<ICategory>('Category', CategorySchema);

export { CategoryModel as Category };
export default CategoryModel;
