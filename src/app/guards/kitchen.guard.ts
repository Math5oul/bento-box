import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';
import { UserRole } from '../interfaces/user.interface';
import { isPlatformBrowser } from '@angular/common';

/**
 * Guard para proteger rotas de cozinha (role 'cozinha' ou 'admin').
 * Admin também pode acessar para monitorar.
 */
export const kitchenGuard = () => {
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
      if (user?.role === 'cozinha' || user?.role === 'admin') {
        return true;
      }
    } catch (e) {
      console.warn('Falha ao parsear usuário localStorage:', e);
    }
  }

  const current = authService.getCurrentUser();
  if (current?.role === UserRole.KITCHEN || current?.role === UserRole.ADMIN) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
