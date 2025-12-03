import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';
import { UserRole } from '../interfaces/user.interface';
import { isPlatformBrowser } from '@angular/common';

/**
 * Guard para proteger rotas de garçom
 * Permite acesso para usuários com permissão accessWaiterPanel ou role 'garcom'/'admin' (backward compatibility)
 */
export const waiterGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      // Backward compatibility: aceita role strings
      if (user?.role === 'garcom' || user?.role === 'admin') {
        return true;
      }

      // Sistema de permissões: verifica accessWaiterPanel
      if (user?.permissions?.accessWaiterPanel === true) {
        return true;
      }
    } catch (e) {
      console.warn('Falha ao parsear usuário localStorage:', e);
    }
  }

  // Verifica no AuthService (usa lógica com backward compatibility)
  if (authService.canAccessWaiterPanel()) {
    return true;
  }

  const current = authService.getCurrentUser();
  if (current?.role === UserRole.WAITER || current?.role === UserRole.ADMIN) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
