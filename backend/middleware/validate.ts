import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Interface de Erro de Validação
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * Middleware para processar resultados de validação
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: ValidationErrorDetail[] = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: formattedErrors,
    });
    return;
  }

  next();
};

/**
 * Wrapper para executar validações
 */
export const runValidations = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (const validation of validations) {
      await validation.run(req);
    }
    next();
  };
};
