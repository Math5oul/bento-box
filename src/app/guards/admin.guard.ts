import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';
import { isPlatformBrowser } from '@angular/common';

/**
 * Guard para proteger rotas que requerem privilégios de administrador
 * Redireciona para a página inicial se o usuário não for admin
 *
 * Verifica diretamente no localStorage para evitar problemas de timing
 * ao dar refresh na página
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
      if (user?.role === 'admin') {
        return true;
      }
    } catch (error) {
      console.error('Erro ao verificar permissões de admin:', error);
    }
  }

  // Também verifica no AuthService (para casos normais de navegação)
  if (authService.isAdmin()) {
    return true;
  }

  // Redireciona para a página inicial se não for admin
  router.navigate(['/']);
  return false;
};
