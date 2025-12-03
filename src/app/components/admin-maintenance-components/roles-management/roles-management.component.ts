import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import { Role, CreateRoleDTO, RolePermissions } from '../../../interfaces/role.interface';

@Component({
  selector: 'app-roles-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-management.component.html',
  styleUrls: ['./roles-management.component.scss'],
})
export class RolesManagementComponent implements OnInit {
  roles: Role[] = [];
  staffRoles: Role[] = [];
  clientRoles: Role[] = [];
  loading = false;

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showPermissionsModal = false;

  // Formulários
  newRole: CreateRoleDTO = {
    name: '',
    slug: '',
    permissions: {},
    clientLevel: 1,
    description: '',
  };

  editingRole: Partial<Role> = {};
  selectedRole: Role | null = null;

  // Filtro/Pesquisa
  searchTerm = '';

  // Lista de permissões disponíveis
  permissionsList: Array<{ key: keyof RolePermissions; label: string; category: string }> = [
    // Painéis
    { key: 'accessWaiterPanel', label: 'Acesso ao Painel do Garçom', category: 'Painéis' },
    { key: 'accessKitchenPanel', label: 'Acesso ao Painel da Cozinha', category: 'Painéis' },
    { key: 'accessAdminPanel', label: 'Acesso ao Painel Administrativo', category: 'Painéis' },

    // Pedidos
    { key: 'canOrder', label: 'Pode Fazer Pedidos', category: 'Pedidos' },
    { key: 'canViewOrders', label: 'Pode Visualizar Pedidos', category: 'Pedidos' },
    { key: 'canManageOrders', label: 'Pode Gerenciar Pedidos', category: 'Pedidos' },

    // Mesas
    { key: 'canManageTables', label: 'Pode Gerenciar Mesas', category: 'Mesas' },
    { key: 'canViewTables', label: 'Pode Visualizar Mesas', category: 'Mesas' },

    // Produtos
    { key: 'canManageProducts', label: 'Pode Gerenciar Produtos', category: 'Produtos' },
    { key: 'canViewProducts', label: 'Pode Visualizar Produtos', category: 'Produtos' },

    // Categorias
    { key: 'canManageCategories', label: 'Pode Gerenciar Categorias', category: 'Categorias' },

    // Usuários
    { key: 'canManageUsers', label: 'Pode Gerenciar Usuários', category: 'Usuários' },
    { key: 'canManageRoles', label: 'Pode Gerenciar Perfis', category: 'Usuários' },

    // Financeiro
    { key: 'canViewReports', label: 'Pode Ver Relatórios', category: 'Financeiro' },
    { key: 'canManagePayments', label: 'Pode Gerenciar Pagamentos', category: 'Financeiro' },
  ];

  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadRoles();
  }

  async loadRoles() {
    this.loading = true;
    try {
      this.roles = await this.roleService.getRoles();
      const grouped = this.roleService.groupRolesByType(this.roles);
      this.staffRoles = grouped.staff;
      this.clientRoles = grouped.clients;
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      alert('Erro ao carregar perfis');
    } finally {
      this.loading = false;
    }
  }

  get filteredRoles(): Role[] {
    if (!this.searchTerm) return this.roles;
    const term = this.searchTerm.toLowerCase();
    return this.roles.filter(
      role =>
        role.name.toLowerCase().includes(term) ||
        role.description?.toLowerCase().includes(term) ||
        role.slug.toLowerCase().includes(term)
    );
  }

  // CRUD Operations
  openCreateModal() {
    this.newRole = {
      name: '',
      slug: '',
      permissions: {},
      clientLevel: 1,
      description: '',
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async createRole() {
    if (!this.newRole.name) {
      alert('Nome do perfil é obrigatório');
      return;
    }

    try {
      await this.roleService.createRole(this.newRole);
      alert('Perfil criado com sucesso!');
      this.closeCreateModal();
      await this.loadRoles();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar perfil');
    }
  }

  openEditModal(role: Role) {
    this.editingRole = { ...role };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingRole = {};
  }

  async updateRole() {
    if (!this.editingRole._id) return;

    try {
      await this.roleService.updateRole(this.editingRole._id, {
        name: this.editingRole.name,
        slug: this.editingRole.slug,
        clientLevel: this.editingRole.clientLevel,
        description: this.editingRole.description,
      });
      alert('Perfil atualizado com sucesso!');
      this.closeEditModal();
      await this.loadRoles();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar perfil');
    }
  }

  async deleteRole(role: Role) {
    if (role.isSystem) {
      alert('Perfis do sistema não podem ser deletados');
      return;
    }

    const confirmed = confirm(
      `Tem certeza que deseja deletar o perfil "${role.name}"?\nEsta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      await this.roleService.deleteRole(role._id);
      alert('Perfil deletado com sucesso!');
      await this.loadRoles();
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar perfil');
    }
  }

  openPermissionsModal(role: Role) {
    this.selectedRole = { ...role };
    this.showPermissionsModal = true;
  }

  closePermissionsModal() {
    this.showPermissionsModal = false;
    this.selectedRole = null;
  }

  async savePermissions() {
    if (!this.selectedRole || !this.selectedRole._id) return;

    try {
      await this.roleService.updateRole(this.selectedRole._id, {
        permissions: this.selectedRole.permissions,
      });
      alert('Permissões atualizadas com sucesso!');
      this.closePermissionsModal();
      await this.loadRoles();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar permissões');
    }
  }

  // Helpers
  getRoleLevelLabel(level: number): string {
    return this.roleService.getClientLevelLabel(level);
  }

  getPermissionsByCategory(category: string) {
    return this.permissionsList.filter(p => p.category === category);
  }

  getCategories(): string[] {
    return Array.from(new Set(this.permissionsList.map(p => p.category)));
  }

  getActivePermissionsCount(role: Role): number {
    return Object.values(role.permissions).filter(v => v === true).length;
  }

  generateSlug() {
    if (this.newRole.name) {
      this.newRole.slug = this.newRole.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
  }

  toggleAllPermissions(enable: boolean) {
    if (!this.selectedRole) return;
    this.permissionsList.forEach(perm => {
      this.selectedRole!.permissions[perm.key] = enable;
    });
  }
}
