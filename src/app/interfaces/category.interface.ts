/**
 * Interface de Desconto por Role de Usuário
 */
export interface CategoryDiscount {
  roleId: string; // ID do role (ex: ObjectId do role)
  roleName?: string; // Nome do role (para exibição)
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
  showInMenu?: boolean; // Se true, aparece no cardápio público. Se false, apenas admin pode adicionar
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
  showInMenu?: boolean;
}

/**
 * DTO para atualizar categoria
 */
export interface UpdateCategoryDTO {
  name?: string;
  emoji?: string;
  slug?: string;
  index?: number;
  showInMenu?: boolean;
}
