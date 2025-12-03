/**
 * Interface de Desconto por Nível de Cliente
 */
export interface CategoryDiscount {
  clientLevel: number;
  discountPercent: number;
}

/**
 * Interface de Categoria
 */
export interface Category {
  _id: string;
  name: string;
  emoji: string;
  slug: string;
  index?: number;
  productCount?: number;
  discounts?: CategoryDiscount[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para criar categoria
 */
export interface CreateCategoryDTO {
  name: string;
  emoji: string;
  slug?: string;
  index?: number;
}

/**
 * DTO para atualizar categoria
 */
export interface UpdateCategoryDTO {
  name?: string;
  emoji?: string;
  slug?: string;
  index?: number;
}
