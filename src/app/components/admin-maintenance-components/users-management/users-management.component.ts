import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../interfaces/user.interface';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss',
})
export class UsersManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  users: User[] = [];
  loading = true;
  searchTerm = ''; // Filtro de pesquisa

  // Array de roles disponíveis
  availableRoles = [
    { value: UserRole.CLIENT, label: 'Cliente' },
    { value: UserRole.ADMIN, label: 'Administrador' },
    { value: UserRole.KITCHEN, label: 'Cozinha' },
    { value: UserRole.WAITER, label: 'Garçom' },
  ];

  // Modal de criação
  showCreateModal = false;
  newUser = {
    name: '',
    email: '',
    password: '',
    role: UserRole.CLIENT,
  };

  // Modal de edição
  showEditModal = false;
  editingUser: Partial<User> = {};

  // Teste de login (sem fazer login real)
  loginEmail = '';
  loginPassword = '';
  loginResult: any = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsers();
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
    this.newUser = {
      name: '',
      email: '',
      password: '',
      role: UserRole.CLIENT,
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
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      alert('⚠️ Preencha todos os campos!');
      return;
    }

    try {
      await this.http
        .post(`${environment.apiUrl}/auth/register`, {
          name: this.newUser.name,
          email: this.newUser.email,
          password: this.newUser.password,
          role: this.newUser.role.toUpperCase(),
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
   * Retorna o label do role
   */
  getRoleLabel(role: string): string {
    const found = this.availableRoles.find(r => r.value === role);
    return found ? found.label : role;
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
}
