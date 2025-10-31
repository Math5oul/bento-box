import { RequestHandler } from 'express';

/**
 * Middleware para ignorar CSRF em rotas públicas
 * Use em conjunto com csurf para proteger apenas rotas sensíveis
 */
export const skipCsrf: RequestHandler = (req, res, next) => {
  // Marque a requisição para ignorar CSRF
  (req as any).skipCsrf = true;
  next();
};
