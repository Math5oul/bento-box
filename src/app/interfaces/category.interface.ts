/**
 * Interface de Categoria
 */
export interface Category {
  _id: string;
  name: string;
  emoji: string;
  slug: string;
  productCount?: number;
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
}

/**
 * DTO para atualizar categoria
 */
export interface UpdateCategoryDTO {
  name?: string;
  emoji?: string;
  slug?: string;
}
