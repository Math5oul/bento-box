import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface do Documento Category do MongoDB
 */
export interface ICategory extends Document {
  name: string;
  emoji: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

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
CategorySchema.index({ slug: 1 });
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
