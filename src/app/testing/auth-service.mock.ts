import { of } from 'rxjs';

/**
 * Mock completo do AuthService para testes unitários
 * Inclui todos os métodos necessários do AuthService
 */
export class MockAuthService {
  // Observables
  currentUser$ = of(null);
  isAuthenticated$ = of(false);

  // Métodos básicos
  getToken() {
    return 'fake-token';
  }

  isAdmin() {
    return false;
  }

  isKitchen() {
    return false;
  }

  isWaiter() {
    return false;
  }

  getCurrentUser() {
    return { id: 1, name: 'Test User', email: 'test@example.com' };
  }

  // Métodos de acesso a painéis
  canAccessAdminPanel() {
    return false;
  }

  canAccessWaiterPanel() {
    return false;
  }

  canAccessKitchenPanel() {
    return false;
  }

  // Métodos de gerenciamento
  canManageOrders() {
    return false;
  }

  canManageTables() {
    return false;
  }

  canManageProducts() {
    return false;
  }

  canManageCategories() {
    return false;
  }

  canManageUsers() {
    return false;
  }

  canManageRoles() {
    return false;
  }

  canManageSystemSettings() {
    return false;
  }

  canViewReports() {
    return false;
  }

  canManagePayments() {
    return false;
  }

  // Método genérico de permissões
  hasPermission(permission: string) {
    return false;
  }

  // Métodos de autenticação
  login(token: string, user: any) {
    // Mock implementation
  }

  logout() {
    // Mock implementation
  }
}

/**
 * Mock usando Jasmine Spies para testes mais avançados
 * Permite verificar se os métodos foram chamados
 */
export const createAuthServiceSpyMock = () => ({
  currentUser$: of(null),
  isAuthenticated$: of(false),
  getToken: jasmine.createSpy('getToken').and.returnValue('fake-token'),
  isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
  isKitchen: jasmine.createSpy('isKitchen').and.returnValue(false),
  isWaiter: jasmine.createSpy('isWaiter').and.returnValue(false),
  getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
  canAccessAdminPanel: jasmine.createSpy('canAccessAdminPanel').and.returnValue(false),
  canAccessWaiterPanel: jasmine.createSpy('canAccessWaiterPanel').and.returnValue(false),
  canAccessKitchenPanel: jasmine.createSpy('canAccessKitchenPanel').and.returnValue(false),
  canManageOrders: jasmine.createSpy('canManageOrders').and.returnValue(false),
  canManageTables: jasmine.createSpy('canManageTables').and.returnValue(false),
  canManageProducts: jasmine.createSpy('canManageProducts').and.returnValue(false),
  canManageCategories: jasmine.createSpy('canManageCategories').and.returnValue(false),
  canManageUsers: jasmine.createSpy('canManageUsers').and.returnValue(false),
  canManageRoles: jasmine.createSpy('canManageRoles').and.returnValue(false),
  canManageSystemSettings: jasmine.createSpy('canManageSystemSettings').and.returnValue(false),
  canViewReports: jasmine.createSpy('canViewReports').and.returnValue(false),
  canManagePayments: jasmine.createSpy('canManagePayments').and.returnValue(false),
  hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false),
  login: jasmine.createSpy('login'),
  logout: jasmine.createSpy('logout'),
});

/**
 * Mock personalizado do AuthService para casos específicos
 * @param permissions - Objeto com permissões específicas para o teste
 */
export const createCustomAuthServiceMock = (
  permissions: Partial<{
    isAdmin: boolean;
    isKitchen: boolean;
    isWaiter: boolean;
    canAccessAdminPanel: boolean;
    canAccessWaiterPanel: boolean;
    canAccessKitchenPanel: boolean;
    canManageOrders: boolean;
    canManageTables: boolean;
    canManageProducts: boolean;
    canManageCategories: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManageSystemSettings: boolean;
    canViewReports: boolean;
    canManagePayments: boolean;
  }> = {}
) => ({
  currentUser$: of(null),
  isAuthenticated$: of(false),
  getToken: () => 'fake-token',
  isAdmin: () => permissions.isAdmin || false,
  isKitchen: () => permissions.isKitchen || false,
  isWaiter: () => permissions.isWaiter || false,
  getCurrentUser: () => ({ id: 1, name: 'Test User', email: 'test@example.com' }),
  canAccessAdminPanel: () => permissions.canAccessAdminPanel || false,
  canAccessWaiterPanel: () => permissions.canAccessWaiterPanel || false,
  canAccessKitchenPanel: () => permissions.canAccessKitchenPanel || false,
  canManageOrders: () => permissions.canManageOrders || false,
  canManageTables: () => permissions.canManageTables || false,
  canManageProducts: () => permissions.canManageProducts || false,
  canManageCategories: () => permissions.canManageCategories || false,
  canManageUsers: () => permissions.canManageUsers || false,
  canManageRoles: () => permissions.canManageRoles || false,
  canManageSystemSettings: () => permissions.canManageSystemSettings || false,
  canViewReports: () => permissions.canViewReports || false,
  canManagePayments: () => permissions.canManagePayments || false,
  hasPermission: (permission: string) => false,
  login: () => {},
  logout: () => {},
});
