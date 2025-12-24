import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';

/**
 * Interceptor para renovação automática de access token
 * Quando o backend retorna 401 (Unauthorized):
 * 1. Tenta renovar o access token usando o refresh token
 * 2. Se bem-sucedido, repete a requisição original
 * 3. Se falhar, redireciona para login
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se não for erro 401, apenas repassa o erro
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Se for a rota de refresh falhando, não tenta de novo (evita loop)
      if (req.url.includes('/api/auth/refresh')) {
        console.warn('🔄 Refresh token expirado. Fazendo logout e redirecionando para login...');
        // Limpa estado de autenticação e redireciona
        const authService = inject(AuthService);
        const router = inject(Router);
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // Se for rota de login falhando, não tenta refresh
      if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
        return throwError(() => error);
      }

      console.log('🔄 Access token expirado. Tentando renovar...');

      // Tenta renovar o token
      return http.post('/api/auth/refresh', {}).pipe(
        switchMap(() => {
          // Token renovado com sucesso, repete a requisição original
          console.log('✅ Token renovado. Repetindo requisição...');
          return next(req);
        }),
        catchError(refreshError => {
          // Falha ao renovar token
          console.error('❌ Falha ao renovar token:', refreshError);
          // Limpa estado de autenticação e redireciona
          const authService = inject(AuthService);
          const router = inject(Router);
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
