import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor que adiciona withCredentials: true em todas as requisições
 * Isso garante que cookies httpOnly sejam enviados automaticamente
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone a requisição adicionando withCredentials
  const clonedReq = req.clone({
    withCredentials: true,
  });

  return next(clonedReq);
};
