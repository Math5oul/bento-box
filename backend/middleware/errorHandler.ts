import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Error Handler Global
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('❌ Erro:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors,
    });
    return;
  }

  // Erro de duplicação (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `${field} já está em uso`,
      error: {
        code: 'DUPLICATE_KEY',
        field,
      },
    });
    return;
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expirado',
    });
    return;
  }

  // Erro de CastError (ID inválido)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'ID inválido',
    });
    return;
  }

  // Erro genérico
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error:
      process.env.NODE_ENV === 'development'
        ? {
            stack: err.stack,
            ...err,
          }
        : undefined,
  });
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
