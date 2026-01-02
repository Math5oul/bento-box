import { Request, Response, NextFunction } from 'express';
import { sanitizeError, logError, isDevelopment } from '../utils/errorSanitizer';
import { createAuditLog } from './auditLogger';

/**
 * Middleware de Error Handler Global
 * Sanitiza erros antes de enviá-los ao cliente
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // Loga erro completo no servidor (com todos os detalhes)
  logError('Global Error Handler', err, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body?.password ? { ...req.body, password: '[REDACTED]' } : req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Sanitiza erro para o cliente
  const sanitized = sanitizeError(err);

  // Registra erros críticos (5xx) no AuditLog
  if (sanitized.statusCode >= 500) {
    const userId = (req as any).user?.userId || (req as any).user?._id;
    const userEmail = (req as any).user?.email;

    createAuditLog(
      'SYSTEM_ERROR',
      'system',
      userId,
      userEmail,
      {
        path: req.path,
        method: req.method,
        errorName: err.name,
        errorMessage: err.message,
        statusCode: sanitized.statusCode,
      },
      undefined,
      false,
      err.message || 'Internal Server Error'
    );
  }

  // Em produção, NUNCA expõe stack traces ou detalhes internos
  const response: any = {
    success: false,
    error: sanitized.message,
    code: sanitized.code,
  };

  // Apenas em desenvolvimento, inclui informações extras (cuidado!)
  if (isDevelopment()) {
    response.debug = {
      type: err.name,
      originalMessage: err.message,
    };
  }

  res.status(sanitized.statusCode).json(response);
};

/**
 * Middleware para rota não encontrada
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
};
