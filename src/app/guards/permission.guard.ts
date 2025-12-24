import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { RolePermissions } from '../interfaces/role.interface';

/**
 * Factory para criar guards baseados em verificação de permissão.
 *
 * - Passe uma string para exigir uma permissão específica.
 * - Passe um array de strings para aceitar qualquer uma das permissões (lógica OR).
 * - Passe uma função para lógica personalizada.
 */
export function createPermissionGuard(
  permissionCheck:
    | keyof RolePermissions
    | (keyof RolePermissions)[]
    | ((authService: AuthService) => boolean)
): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // No servidor, sempre nega acesso
    if (!isPlatformBrowser(platformId)) {
      return false;
    }

    let hasAccess = false;

    // Se for uma função customizada, executa diretamente
    if (typeof permissionCheck === 'function') {
      hasAccess = permissionCheck(authService);
    }
    // Se for array de permissões, verifica se tem pelo menos uma (OR logic)
    else if (Array.isArray(permissionCheck)) {
      hasAccess = permissionCheck.some(permission => {
        const methodName = permission as keyof AuthService;
        const method = authService[methodName];
        if (typeof method === 'function') {
          return (method as Function).call(authService);
        }
        return authService.hasPermission(permission as keyof RolePermissions);
      });
    }
    // Se for string única, verifica aquela permissão
    else {
      const methodName = permissionCheck as keyof AuthService;
      const method = authService[methodName];
      if (typeof method === 'function') {
        hasAccess = (method as Function).call(authService);
      } else {
        hasAccess = authService.hasPermission(permissionCheck as keyof RolePermissions);
      }
    }

    if (!hasAccess) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
}

/**
 * Guard para rotas administrativas
 * Requer: accessAdminPanel
 */
export const adminGuard = createPermissionGuard((authService: AuthService) => {
  return authService.canAccessAdminPanel();
});

/**
 * Guard para rotas de garçom
 * Requer: accessWaiterPanel
 */
export const waiterGuard = createPermissionGuard((authService: AuthService) => {
  return authService.canAccessWaiterPanel();
});

/**
 * Guard para rotas de cozinha
 * Requer: accessKitchenPanel
 */
export const kitchenGuard = createPermissionGuard((authService: AuthService) => {
  return authService.canAccessKitchenPanel();
});

/**
 * Guard para checkout
 * Requer: accessAdminPanel OU accessWaiterPanel OU canManagePayments
 */
export const checkoutGuard = createPermissionGuard((authService: AuthService) => {
  return (
    authService.canAccessAdminPanel() ||
    authService.canAccessWaiterPanel() ||
    authService.canManagePayments()
  );
});

/**
 * Guard para painel de mesas
 * Requer: accessAdminPanel OU canManageTables OU canViewTables
 */
export const tablesGuard = createPermissionGuard((authService: AuthService) => {
  return (
    authService.canAccessAdminPanel() ||
    authService.hasPermission('canManageTables') ||
    authService.hasPermission('canViewTables')
  );
});
