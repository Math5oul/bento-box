import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { UserRole } from '../interfaces/user.interface';

/**
 * Guard para proteger rotas que requerem privilégios de administrador
 * Redireciona para a página inicial se o usuário não for admin
 *
 * Verifica permissões do sistema de roles dinâmico
 */
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // No servidor, sempre nega acesso
  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  // Verifica diretamente no localStorage para casos de refresh
  const userStr = localStorage.getItem('user');

  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      // Backward compatibility: aceita role string 'admin'
      if (user?.role === UserRole.ADMIN || user?.role === 'admin') {
        return true;
      }

      // Sistema de permissões: verifica accessAdminPanel
      if (user?.permissions?.accessAdminPanel === true) {
        return true;
      }
    } catch (error) {
      console.error('Erro ao verificar permissões de admin:', error);
    }
  }

  // Também verifica no AuthService (usa lógica com backward compatibility)
  if (authService.canAccessAdminPanel()) {
    return true;
  }

  // Redireciona para a página inicial se não for admin
  router.navigate(['/']);
  return false;
};
