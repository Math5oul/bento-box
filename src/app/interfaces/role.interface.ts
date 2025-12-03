/**
 * Interface de Permissões do Role
 */
export interface RolePermissions {
  // Acessos a Painéis
  accessWaiterPanel: boolean;
  accessKitchenPanel: boolean;
  accessAdminPanel: boolean;

  // Permissões de Pedidos
  canOrder: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;

  // Permissões de Mesas
  canManageTables: boolean;
  canViewTables: boolean;

  // Permissões de Produtos
  canManageProducts: boolean;
  canViewProducts: boolean;

  // Permissões de Categorias
  canManageCategories: boolean;

  // Permissões de Usuários
  canManageUsers: boolean;
  canManageRoles: boolean;

  // Permissões de Sistema
  canManageSystemSettings: boolean;

  // Permissões Financeiras
  canViewReports: boolean;
  canManagePayments: boolean;
}

/**
 * Interface do Role (Perfil de Usuário)
 */
export interface Role {
  _id: string;
  name: string;
  slug: string;
  permissions: RolePermissions;
  isSystem: boolean;
  clientLevel: number; // 0 = staff, 1+ = client levels
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para criar/atualizar Role
 */
export interface CreateRoleDTO {
  name: string;
  slug?: string;
  permissions: Partial<RolePermissions>;
  clientLevel: number;
  description?: string;
}

/**
 * Interface para listar níveis de cliente (usado em descontos)
 */
export interface ClientLevel {
  level: number;
  name: string;
  slug: string;
}
