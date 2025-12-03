import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../interfaces/user.interface';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../interfaces/role.interface';
import { RolesManagementComponent } from '../roles-management/roles-management.component';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roleDetails?: Role;
  createdAt: string;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminHeaderComponent,
    RolesManagementComponent,
  ],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss',
})
export class UsersManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private roleService = inject(RoleService);

  // Controle de abas
  activeTab: 'users' | 'roles' = 'users';

  users: User[] = [];
  roles: Role[] = [];
  loading = true;
  loadingRoles = true;
  searchTerm = ''; // Filtro de pesquisa

  // Array de roles disponíveis (carregado dinamicamente)
  availableRoles: Array<{ value: string; label: string; clientLevel: number }> = [];

  // Modal de criação
  showCreateModal = false;
  newUser = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '', // Will be set after roles are loaded
  };

  // Modal de edição
  showEditModal = false;
  editingUser: Partial<User> = {};

  // Teste de login (sem fazer login real)
  loginEmail = '';
  loginPassword = '';
  loginResult: any = null;

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      await this.loadRoles();
      await this.loadUsers();
    }
  }

  /**
   * Carrega roles disponíveis da API
   */
  async loadRoles(): Promise<void> {
    this.loadingRoles = true;
    try {
      this.roles = await this.roleService.getRoles();

      // Converte para formato de dropdown (ID do role ao invés de enum)
      this.availableRoles = this.roles.map(role => ({
        value: role._id, // Use ObjectId for new role system
        label: `${role.name} ${role.clientLevel === 0 ? '(Staff)' : `(Nível ${role.clientLevel})`}`,
        clientLevel: role.clientLevel,
      }));

      // Set default role (primeiro cliente ou primeiro role disponível)
      const defaultClientRole = this.roles.find(r => r.clientLevel > 0);
      this.newUser.role = defaultClientRole?._id || this.roles[0]?._id || '';

      console.log('Roles carregados:', this.roles);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      alert('Erro ao carregar perfis. Usando perfis padrão.');
      // Fallback para roles antigos se API falhar
      this.availableRoles = [
        { value: UserRole.CLIENT, label: 'Cliente (Legacy)', clientLevel: 1 },
        { value: UserRole.ADMIN, label: 'Administrador (Legacy)', clientLevel: 0 },
        { value: UserRole.KITCHEN, label: 'Cozinha (Legacy)', clientLevel: 0 },
        { value: UserRole.WAITER, label: 'Garçom (Legacy)', clientLevel: 0 },
      ];
      this.newUser.role = UserRole.CLIENT;
    } finally {
      this.loadingRoles = false;
    }
  }

  /**
   * Retorna usuários filtrados pela pesquisa
   */
  get filteredUsers(): User[] {
    if (!this.searchTerm.trim()) {
      return this.users;
    }

    const term = this.searchTerm.toLowerCase();
    return this.users.filter(
      user => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    );
  }

  /**
   * Carrega todos os usuários (exceto anônimos)
   */
  async loadUsers(): Promise<void> {
    this.loading = true;
    try {
      const token = localStorage.getItem('auth_token');
      const response: any = await this.http
        .get(`${environment.apiUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .toPromise();

      // A API retorna array direto ou objeto com data
      let allUsers = Array.isArray(response) ? response : response.data || [];

      // Filtrar usuários anônimos (serão deletados automaticamente quando a mesa quitar a conta)
      this.users = allUsers.filter(
        (user: any) => !user.isAnonymous && user.email && !user.email.includes('@anonymous.')
      );

      console.log('Usuários carregados (sem anônimos):', this.users);
      this.loading = false;
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      alert('❌ Erro ao carregar usuários: ' + (error.error?.message || error.message));
      this.loading = false;
    }
  }

  /**
   * Abre modal de criação
   */
  openCreateModal(): void {
    // Use primeiro role de cliente ou primeiro disponível
    const defaultClientRole = this.roles.find(r => r.clientLevel > 0);
    const defaultRole = defaultClientRole?._id || this.roles[0]?._id || '';

    this.newUser = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: defaultRole,
    };
    this.showCreateModal = true;
  }

  /**
   * Fecha modal de criação
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  /**
   * Cria um novo usuário
   */
  async createUser(): Promise<void> {
    if (
      !this.newUser.name ||
      !this.newUser.email ||
      !this.newUser.password ||
      !this.newUser.confirmPassword
    ) {
      alert('⚠️ Preencha todos os campos!');
      return;
    }

    if (this.newUser.password !== this.newUser.confirmPassword) {
      alert('⚠️ As senhas não conferem!');
      return;
    }

    if (this.newUser.password.length < 6) {
      alert('⚠️ A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    try {
      await this.http
        .post(`${environment.apiUrl}/auth/register`, {
          name: this.newUser.name,
          email: this.newUser.email,
          password: this.newUser.password,
          confirmPassword: this.newUser.confirmPassword,
          role: this.newUser.role, // Send ObjectId directly (or enum if fallback)
        })
        .toPromise();

      alert('✅ Usuário criado com sucesso!');
      this.closeCreateModal();
      this.loadUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      alert('❌ Erro ao criar usuário: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Abre modal de edição
   */
  openEditModal(user: User): void {
    this.editingUser = { ...user };
    this.showEditModal = true;
  }

  /**
   * Fecha modal de edição
   */
  closeEditModal(): void {
    this.showEditModal = false;
  }

  /**
   * Atualiza usuário (muda role)
   */
  async updateUser(): Promise<void> {
    if (!this.editingUser._id) return;

    try {
      const token = localStorage.getItem('auth_token');
      await this.http
        .patch(
          `${environment.apiUrl}/admin/users/${this.editingUser._id}/role`,
          {
            role: this.editingUser.role,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .toPromise();

      alert('✅ Usuário atualizado com sucesso!');
      this.closeEditModal();
      this.loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      alert('❌ Erro ao atualizar usuário: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Deleta um usuário
   */
  async deleteUser(userId: string, userName: string): Promise<void> {
    if (!confirm(`Tem certeza que deseja deletar o usuário "${userName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await this.http
        .delete(`${environment.apiUrl}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .toPromise();

      alert('✅ Usuário deletado com sucesso!');
      this.loadUsers();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      alert('❌ Erro ao deletar usuário: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Testa login (apenas validação, sem fazer login de fato)
   */
  async testLogin(): Promise<void> {
    if (!this.loginEmail || !this.loginPassword) {
      this.loginResult = { success: false, message: 'Preencha email e senha' };
      return;
    }

    try {
      const response: any = await this.http
        .post(`${environment.apiUrl}/auth/login`, {
          email: this.loginEmail,
          password: this.loginPassword,
        })
        .toPromise();

      this.loginResult = {
        success: true,
        message: '✅ Credenciais válidas!',
        user: response.data?.user,
        tokenPreview: response.data?.token ? response.data.token.substring(0, 20) + '...' : '',
      };
    } catch (error: any) {
      this.loginResult = {
        success: false,
        message: '❌ ' + (error.error?.message || error.message),
      };
    }
  }

  /**
   * Limpa resultado do teste
   */
  clearLoginTest(): void {
    this.loginEmail = '';
    this.loginPassword = '';
    this.loginResult = null;
  }

  /**
   * Retorna o label do role (suporta enum legacy e ObjectId)
   */
  getRoleLabel(role: string): string {
    if (!role) return 'Sem Role';

    // Tenta encontrar nos roles dinâmicos (ObjectId)
    const foundDynamic = this.availableRoles.find(r => r.value === role);
    if (foundDynamic) {
      return foundDynamic.label;
    }

    // Tenta encontrar pelo ID do role (para roles populados)
    const foundById = this.roles.find(r => r._id === role);
    if (foundById) {
      return `${foundById.name} ${foundById.clientLevel === 0 ? '(Staff)' : `(Nível ${foundById.clientLevel})`}`;
    }

    // Tenta encontrar pelo slug (para buscar role por nome enum)
    const foundBySlug = this.roles.find(r => r.slug === role.toLowerCase() || r.slug === role);
    if (foundBySlug) {
      return `${foundBySlug.name} ${foundBySlug.clientLevel === 0 ? '(Staff)' : `(Nível ${foundBySlug.clientLevel})`}`;
    }

    // Fallback para enum legacy (compatibilidade)
    const legacyLabels: Record<string, string> = {
      admin: 'Administrador (Legacy)',
      client: 'Cliente (Legacy)',
      cozinha: 'Cozinha (Legacy)',
      garcom: 'Garçom (Legacy)',
      garçom: 'Garçom (Legacy)',
      waiter: 'Garçom (Legacy)',
      kitchen: 'Cozinha (Legacy)',
      user: 'Usuário (Legacy)',
      table: 'Mesa (Legacy)',
    };

    const lowerRole = role.toLowerCase();
    return legacyLabels[lowerRole] || `${role} (Legacy)`;
  }

  /**
   * Envia email de recuperação de senha (ainda não implementado no backend)
   */
  async sendPasswordReset(userEmail: string, userName: string): Promise<void> {
    alert(
      `🚧 Funcionalidade em desenvolvimento\n\nEm breve será possível enviar email de recuperação de senha para:\n📧 ${userEmail}\n👤 ${userName}`
    );

    // TODO: Implementar no backend
    // try {
    //   await this.http.post(`${environment.apiUrl}/auth/forgot-password`, {
    //     email: userEmail
    //   }).toPromise();
    //
    //   alert('✅ Email de recuperação enviado!');
    // } catch (error: any) {
    //   console.error('Erro ao enviar email:', error);
    //   alert('❌ Erro ao enviar email: ' + (error.error?.message || error.message));
    // }
  }

  /**
   * Conta quantos usuários têm roles legacy (enum antigo)
   */
  get legacyUsersCount(): number {
    return this.users.filter(user => {
      // Se o role não é encontrado nos roles dinâmicos, é legacy
      const isDynamicRole = this.availableRoles.some(r => r.value === user.role);
      const isNewRole = this.roles.some(r => r._id === user.role);
      return !isDynamicRole && !isNewRole;
    }).length;
  }

  /**
   * Migra usuários com roles enum antigos para os novos roles customizados
   */
  async migrateLegacyRoles(): Promise<void> {
    const legacyUsers = this.users.filter(user => {
      const isDynamicRole = this.availableRoles.some(r => r.value === user.role);
      const isNewRole = this.roles.some(r => r._id === user.role);
      return !isDynamicRole && !isNewRole;
    });

    if (legacyUsers.length === 0) {
      alert('✅ Todos os usuários já estão usando os novos perfis!');
      return;
    }

    const confirm = window.confirm(
      `🔄 Migração de Perfis Legacy\n\n` +
        `Foram encontrados ${legacyUsers.length} usuário(s) usando perfis antigos.\n\n` +
        `Esta ação irá:\n` +
        `• Converter "admin" → "Administrador"\n` +
        `• Converter "client" → "Cliente"\n` +
        `• Converter "garcom" → "Garçom"\n` +
        `• Converter "cozinha" → "Cozinha"\n\n` +
        `Deseja continuar?`
    );

    if (!confirm) return;

    try {
      // Mapa de conversão: enum antigo → slug do novo role
      const roleMap: Record<string, string> = {
        admin: 'administrador',
        client: 'cliente',
        garcom: 'garcom',
        garçom: 'garcom',
        waiter: 'garcom',
        cozinha: 'cozinha',
        kitchen: 'cozinha',
        user: 'cliente',
        table: 'cliente',
      };

      let migrated = 0;
      let errors = 0;

      for (const user of legacyUsers) {
        const oldRole = user.role.toLowerCase();
        const newSlug = roleMap[oldRole];

        if (!newSlug) {
          console.warn(`Role desconhecido: ${user.role}`);
          errors++;
          continue;
        }

        // Busca o novo role pelo slug
        const newRole = this.roles.find(r => r.slug === newSlug);
        if (!newRole) {
          console.warn(`Role com slug "${newSlug}" não encontrado`);
          errors++;
          continue;
        }

        try {
          // Atualiza o usuário com o novo role
          const token = localStorage.getItem('auth_token');
          await this.http
            .patch(
              `${environment.apiUrl}/admin/users/${user._id}/role`,
              { role: newRole._id },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .toPromise();

          migrated++;
        } catch (error) {
          console.error(`Erro ao migrar usuário ${user.email}:`, error);
          errors++;
        }
      }

      if (errors === 0) {
        alert(
          `✅ Migração concluída com sucesso!\n\n` +
            `${migrated} usuário(s) migrado(s) para os novos perfis.`
        );
      } else {
        alert(
          `⚠️ Migração concluída com avisos\n\n` +
            `✅ ${migrated} usuário(s) migrado(s)\n` +
            `❌ ${errors} erro(s) encontrado(s)\n\n` +
            `Verifique o console para mais detalhes.`
        );
      }

      // Recarrega lista de usuários
      await this.loadUsers();
    } catch (error) {
      console.error('Erro na migração:', error);
      alert('❌ Erro durante a migração. Verifique o console.');
    }
  }
}
