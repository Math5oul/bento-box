import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface de Permissões do Role
 */
export interface IRolePermissions {
  // Acessos a Painéis
  accessWaiterPanel: boolean; // Acesso ao painel do garçom
  accessKitchenPanel: boolean; // Acesso ao painel da cozinha
  accessAdminPanel: boolean; // Acesso ao painel administrativo

  // Permissões de Pedidos
  canOrder: boolean; // Pode fazer pedidos
  canViewOrders: boolean; // Pode visualizar pedidos
  canManageOrders: boolean; // Pode gerenciar pedidos (aceitar, cancelar)

  // Permissões de Mesas
  canManageTables: boolean; // Pode gerenciar mesas e reservas
  canViewTables: boolean; // Pode visualizar status das mesas

  // Permissões de Produtos
  canManageProducts: boolean; // Pode adicionar/editar produtos
  canViewProducts: boolean; // Pode visualizar cardápio

  // Permissões de Categorias
  canManageCategories: boolean; // Pode gerenciar categorias

  // Permissões de Usuários
  canManageUsers: boolean; // Pode gerenciar contas de usuários
  canManageRoles: boolean; // Pode gerenciar perfis e permissões

  // Permissões de Sistema
  canManageSystemSettings: boolean; // Pode gerenciar configurações do sistema

  // Permissões Financeiras
  canViewReports: boolean; // Pode ver relatórios financeiros
  canManagePayments: boolean; // Pode processar pagamentos
}

/**
 * Interface do Documento Role do MongoDB
 */
export interface IRole extends Document {
  name: string; // Nome do perfil (ex: "Garçom", "Cozinha", "Cliente VIP")
  slug: string; // Identificador único (ex: "garcom", "cozinha", "cliente-vip")
  permissions: IRolePermissions; // Permissões do perfil
  isSystem: boolean; // Se é um perfil do sistema (não pode ser deletado)
  clientLevel: number; // 0 = staff (garçom, cozinha, admin), 1 = cliente nível 1, 2 = cliente nível 2, etc
  description?: string; // Descrição do perfil
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permissões padrão para cada tipo de perfil
 */
export const DEFAULT_PERMISSIONS: Record<string, IRolePermissions> = {
  admin: {
    accessWaiterPanel: true,
    accessKitchenPanel: true,
    accessAdminPanel: true,
    canOrder: true,
    canViewOrders: true,
    canManageOrders: true,
    canManageTables: true,
    canViewTables: true,
    canManageProducts: true,
    canViewProducts: true,
    canManageCategories: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageSystemSettings: true,
    canViewReports: true,
    canManagePayments: true,
  },
  waiter: {
    accessWaiterPanel: true,
    accessKitchenPanel: false,
    accessAdminPanel: false,
    canOrder: true,
    canViewOrders: true,
    canManageOrders: true,
    canManageTables: true,
    canViewTables: true,
    canManageProducts: false,
    canViewProducts: true,
    canManageCategories: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageSystemSettings: false,
    canViewReports: false,
    canManagePayments: true,
  },
  kitchen: {
    accessWaiterPanel: false,
    accessKitchenPanel: true,
    accessAdminPanel: false,
    canOrder: false,
    canViewOrders: true,
    canManageOrders: true,
    canManageTables: false,
    canViewTables: false,
    canManageProducts: false,
    canViewProducts: true,
    canManageCategories: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageSystemSettings: false,
    canViewReports: false,
    canManagePayments: false,
  },
  client: {
    accessWaiterPanel: false,
    accessKitchenPanel: false,
    accessAdminPanel: false,
    canOrder: true,
    canViewOrders: true,
    canManageOrders: false,
    canManageTables: false,
    canViewTables: false,
    canManageProducts: false,
    canViewProducts: true,
    canManageCategories: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageSystemSettings: false,
    canViewReports: false,
    canManagePayments: false,
  },
};

/**
 * Schema de Permissões
 */
const PermissionsSchema = new Schema<IRolePermissions>(
  {
    accessWaiterPanel: { type: Boolean, default: false },
    accessKitchenPanel: { type: Boolean, default: false },
    accessAdminPanel: { type: Boolean, default: false },
    canOrder: { type: Boolean, default: false },
    canViewOrders: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: false },
    canManageTables: { type: Boolean, default: false },
    canViewTables: { type: Boolean, default: false },
    canManageProducts: { type: Boolean, default: false },
    canViewProducts: { type: Boolean, default: true },
    canManageCategories: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    canManageSystemSettings: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManagePayments: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Schema do Role
 */
const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Nome do perfil é obrigatório'],
      trim: true,
      maxlength: [50, 'Nome não pode ter mais de 50 caracteres'],
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [50, 'Slug não pode ter mais de 50 caracteres'],
    },
    permissions: {
      type: PermissionsSchema,
      required: true,
      default: () => DEFAULT_PERMISSIONS['client'],
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    clientLevel: {
      type: Number,
      default: 1, // 0 = staff, 1+ = client levels
      min: [0, 'Client level não pode ser negativo'],
      max: [10, 'Client level não pode ser maior que 10'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Descrição não pode ter mais de 200 caracteres'],
    },
  },
  {
    timestamps: true,
    collection: 'roles',
  }
);

/**
 * Índices
 * Note: slug, isSystem, and clientLevel already have index: true in schema
 */
RoleSchema.index({ name: 1 });

/**
 * Middleware: Gerar slug automaticamente antes de salvar
 */
RoleSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
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
 * Middleware: Prevenir deleção de perfis do sistema
 */
RoleSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  if (this.isSystem) {
    return next(new Error('Perfis do sistema não podem ser deletados'));
  }
  next();
});

RoleSchema.pre('findOneAndDelete', async function (next) {
  const role = await this.model.findOne(this.getFilter());
  if (role && role.isSystem) {
    return next(new Error('Perfis do sistema não podem ser deletados'));
  }
  next();
});

/**
 * Model do Role
 */
const RoleModel = mongoose.model<IRole>('Role', RoleSchema);

export { RoleModel as Role };
export default RoleModel;
