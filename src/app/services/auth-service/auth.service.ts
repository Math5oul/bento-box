import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User, UserRole } from '../../interfaces/user.interface';
import { RolePermissions } from '../../interfaces/role.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    // Token agora vem via cookie httpOnly (gerenciado pelo navegador)
    // Apenas carrega os dados do usuário do localStorage
    const userStr = localStorage.getItem('user');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Erro ao carregar usuário do storage:', error);
        this.logout();
      }
    }
  }

  login(token: string, user: User): void {
    if (this.isBrowser) {
      // Preserva tableId e sessionToken antes de fazer login
      const existingTableId = localStorage.getItem('tableId');
      const existingTableNumber = localStorage.getItem('tableNumber');
      const existingSessionToken = localStorage.getItem('sessionToken');

      // Token agora vem via cookie httpOnly do backend (não precisa armazenar)
      // Apenas salva os dados do usuário
      localStorage.setItem('user', JSON.stringify(user));

      // Restaura tableId se existia (usuário estava em uma mesa antes do login)
      if (existingTableId) {
        localStorage.setItem('tableId', existingTableId);
      }
      if (existingTableNumber) {
        localStorage.setItem('tableNumber', existingTableNumber);
      }

      // Transfere pedidos anônimos se existia sessionToken
      if (existingTableId && existingSessionToken) {
        this.transferAnonymousOrders(existingTableId, existingSessionToken);
      }

      // Remove sessionToken após transferência
      localStorage.removeItem('sessionToken');
    }
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Transfere pedidos anônimos para o usuário autenticado
   */
  private transferAnonymousOrders(tableId: string, sessionToken: string): void {
    // Cookie enviado automaticamente via credentialsInterceptor
    this.http
      .patch<{
        success: boolean;
        message: string;
        count: number;
      }>('/api/orders/transfer-anonymous', { tableId, sessionToken })
      .subscribe({
        next: response => {
          if (response.count > 0) {
            console.log(`✅ ${response.count} pedido(s) transferido(s)`);
          }
        },
        error: err => {
          console.error('Erro ao transferir pedidos:', err);
        },
      });
  }

  logout(): void {
    if (this.isBrowser) {
      // Token será limpo pelo backend via clearCookie
      // Apenas remove dados do usuário do localStorage
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Redireciona para a raiz da página para limpar todo o estado da aplicação
    if (this.isBrowser) {
      window.location.href = '/';
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();

    // Legacy: Verifica se o role é string 'admin'
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }

    // Novo formato: Verifica se roleDetails.slug é 'admin'
    if (user?.roleDetails?.slug === 'admin') {
      return true;
    }

    return false;
  }

  isKitchen(): boolean {
    const user = this.getCurrentUser();

    // Legacy: Verifica se o role é string 'cozinha'
    if (user?.role === UserRole.KITCHEN || user?.role === 'cozinha') {
      return true;
    }

    // Novo formato: Verifica se roleDetails.slug é 'cozinha'
    if (user?.roleDetails?.slug === 'cozinha') {
      return true;
    }

    return false;
  }

  isWaiter(): boolean {
    const user = this.getCurrentUser();

    // Legacy: Verifica se o role é string 'garcom'
    if (user?.role === UserRole.WAITER || user?.role === 'garcom') {
      return true;
    }

    // Novo formato: Verifica se roleDetails.slug é 'garcom'
    if (user?.roleDetails?.slug === 'garcom') {
      return true;
    }

    return false;
  }

  isClient(): boolean {
    const user = this.getCurrentUser();

    // Legacy: Verifica se o role é string 'client'
    if (user?.role === UserRole.CLIENT || user?.role === 'client') {
      return true;
    }

    // Novo formato: Verifica se roleDetails.slug é 'client'
    if (user?.roleDetails?.slug === 'client') {
      return true;
    }

    return false;
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  hasPermission(permission: keyof RolePermissions): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.[permission] ?? false;
  }

  /**
   * Verifica se o usuário tem acesso ao painel de administração
   */
  canAccessAdminPanel(): boolean {
    const user = this.getCurrentUser();

    // Admin legacy tem acesso a tudo
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }

    // Se role é um ObjectId (string longa) mas não temos permissions, precisa relogar
    if (
      user?.role &&
      typeof user.role === 'string' &&
      user.role.length === 24 &&
      !user.permissions
    ) {
      return false;
    }

    return this.hasPermission('accessAdminPanel');
  }

  /**
   * Verifica se o usuário tem acesso ao painel da cozinha
   */
  canAccessKitchenPanel(): boolean {
    const user = this.getCurrentUser();

    // Admin legacy tem acesso a tudo
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }

    // Se role é ObjectId mas sem permissions, bloqueia
    if (
      user?.role &&
      typeof user.role === 'string' &&
      user.role.length === 24 &&
      !user.permissions
    ) {
      return false;
    }

    return this.hasPermission('accessKitchenPanel');
  }

  /**
   * Verifica se o usuário tem acesso ao painel do garçom
   */
  canAccessWaiterPanel(): boolean {
    const user = this.getCurrentUser();

    // Admin legacy tem acesso a tudo
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }

    // Se role é ObjectId mas sem permissions, bloqueia
    if (
      user?.role &&
      typeof user.role === 'string' &&
      user.role.length === 24 &&
      !user.permissions
    ) {
      return false;
    }

    return this.hasPermission('accessWaiterPanel');
  }

  /**
   * Verifica se o usuário pode gerenciar pedidos
   */
  canManageOrders(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageOrders');
  }

  /**
   * Verifica se o usuário pode gerenciar mesas
   */
  canManageTables(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageTables');
  }

  /**
   * Verifica se o usuário pode gerenciar produtos
   */
  canManageProducts(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageProducts');
  }

  /**
   * Verifica se o usuário pode gerenciar fillers
   */
  canManageFillers(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageFillers');
  }

  /**
   * Verifica se o usuário pode gerenciar categorias
   */
  canManageCategories(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageCategories');
  }

  /**
   * Verifica se o usuário pode visualizar usuários
   */
  canViewUsers(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canViewUsers');
  }

  /**
   * Verifica se o usuário pode gerenciar usuários
   */
  canManageUsers(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageUsers');
  }

  /**
   * Verifica se o usuário pode gerenciar roles
   */
  canManageRoles(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageRoles');
  }

  /**
   * Verifica se o usuário pode gerenciar configurações do sistema
   */
  canManageSystemSettings(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManageSystemSettings');
  }

  /**
   * Verifica se o usuário pode visualizar relatórios
   */
  canViewReports(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canViewReports');
  }

  /**
   * Verifica se o usuário pode gerenciar pagamentos
   */
  canManagePayments(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
      return true;
    }
    return this.hasPermission('canManagePayments');
  }

  getToken(): string | null {
    // Deprecated: Token agora vem via cookie httpOnly
    // Este método é mantido para compatibilidade mas retorna null
    return null;
  }

  /**
   * Valida se a sessão atual ainda é válida no backend
   * Retorna true se autenticado, false caso contrário
   */
  async validateSession(): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }

    // Se não há dados de usuário, não está logado
    if (!this.getCurrentUser()) {
      return false;
    }

    try {
      // Faz uma requisição simples para validar o token
      const response = await this.http
        .get<{ success: boolean; authenticated: boolean }>('/api/auth/validate-session')
        .toPromise();

      return response?.authenticated ?? false;
    } catch (error) {
      // Se falhar (401, 403, etc), sessão inválida
      console.warn('Sessão inválida, fazendo logout...');
      this.logout();
      return false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    // Cookie enviado automaticamente via credentialsInterceptor
    // Não precisa mais de Authorization header manual
    return this.http
      .post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      })
      .toPromise();
  }

  /**
   * Verifica se existe uma sessão anônima ativa
   */
  hasAnonymousSession(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const sessionToken = localStorage.getItem('sessionToken');
    return !!sessionToken;
  }

  /**
   * Obtém informações da sessão anônima
   */
  getAnonymousSession(): { sessionToken: string; tableId: string; tableNumber: string } | null {
    if (!this.isBrowser) {
      return null;
    }

    const sessionToken = localStorage.getItem('sessionToken');
    const tableId = localStorage.getItem('tableId');
    const tableNumber = localStorage.getItem('tableNumber');

    if (sessionToken && tableId && tableNumber) {
      return { sessionToken, tableId, tableNumber };
    }

    return null;
  }

  /**
   * Converte sessão anônima fazendo login
   */
  async convertAnonymousWithLogin(email: string, password: string): Promise<any> {
    const session = this.getAnonymousSession();

    if (!session) {
      throw new Error('Nenhuma sessão anônima encontrada');
    }

    try {
      const response = await this.http
        .post('/api/auth/convert-anonymous', {
          sessionToken: session.sessionToken,
          action: 'login',
          loginData: { email, password },
        })
        .toPromise();

      // Atualiza estado de autenticação
      if (response && (response as any).success) {
        const { token, user, table } = response as any;

        // Se retornou informações da mesa, salva no localStorage
        if (table && this.isBrowser) {
          localStorage.setItem('tableId', table.tableId);
          localStorage.setItem('tableNumber', table.tableNumber);
        }

        this.login(token, user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Converte sessão anônima fazendo registro
   */
  async convertAnonymousWithRegister(name: string, email: string, password: string): Promise<any> {
    const session = this.getAnonymousSession();

    if (!session) {
      throw new Error('Nenhuma sessão anônima encontrada');
    }

    try {
      const response = await this.http
        .post('/api/auth/convert-anonymous', {
          sessionToken: session.sessionToken,
          action: 'register',
          registerData: { name, email, password },
        })
        .toPromise();

      // Atualiza estado de autenticação
      if (response && (response as any).success) {
        const { token, user, table } = response as any;

        // Se retornou informações da mesa, salva no localStorage
        if (table && this.isBrowser) {
          localStorage.setItem('tableId', table.tableId);
          localStorage.setItem('tableNumber', table.tableNumber);
        }

        this.login(token, user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}
