/**
 * Error Sanitization Utility
 * Remove informações sensíveis de erros antes de enviá-los ao cliente
 */

export interface SanitizedError {
  message: string;
  statusCode: number;
  code?: string;
}

/**
 * Mensagens de erro genéricas por categoria
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Autenticação
  AUTHENTICATION_FAILED: 'Falha na autenticação',
  UNAUTHORIZED: 'Acesso não autorizado',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  TOKEN_EXPIRED: 'Sessão expirada',

  // Validação
  VALIDATION_ERROR: 'Dados inválidos',
  REQUIRED_FIELD: 'Campo obrigatório não fornecido',
  INVALID_FORMAT: 'Formato de dados inválido',

  // Database
  DATABASE_ERROR: 'Erro ao processar operação',
  NOT_FOUND: 'Recurso não encontrado',
  DUPLICATE_ENTRY: 'Registro já existe',

  // Operações
  CREATE_FAILED: 'Erro ao criar registro',
  UPDATE_FAILED: 'Erro ao atualizar registro',
  DELETE_FAILED: 'Erro ao deletar registro',

  // Sistema
  INTERNAL_ERROR: 'Erro interno do servidor',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível',

  // Upload/Files
  FILE_UPLOAD_ERROR: 'Erro ao fazer upload do arquivo',
  INVALID_FILE_TYPE: 'Tipo de arquivo inválido',

  // Payment
  PAYMENT_ERROR: 'Erro ao processar pagamento',
};

/**
 * Sanitiza erro para envio ao cliente
 * Remove stack traces, paths internos, e outras informações sensíveis
 */
export const sanitizeError = (
  error: any,
  defaultMessage: string = 'Erro ao processar operação'
): SanitizedError => {
  // Erro de validação do Mongoose
  if (error.name === 'ValidationError') {
    return {
      message: 'Dados inválidos fornecidos',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    };
  }

  // Erro de cast do Mongoose (ID inválido)
  if (error.name === 'CastError') {
    return {
      message: 'Identificador inválido',
      statusCode: 400,
      code: 'INVALID_ID',
    };
  }

  // Erro de duplicação (unique constraint)
  if (error.code === 11000 || error.name === 'MongoServerError') {
    return {
      message: 'Registro já existe',
      statusCode: 409,
      code: 'DUPLICATE_ENTRY',
    };
  }

  // Erro de autenticação JWT
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return {
      message: 'Sessão inválida ou expirada',
      statusCode: 401,
      code: 'AUTHENTICATION_FAILED',
    };
  }

  // Erro HTTP com status code
  if (error.statusCode || error.status) {
    const statusCode = error.statusCode || error.status;
    return {
      message: error.message || defaultMessage,
      statusCode,
      code: error.code,
    };
  }

  // Erro genérico
  return {
    message: defaultMessage,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
  };
};

/**
 * Loga erro de forma segura (apenas servidor)
 * Exibe detalhes completos no console do servidor, mas não expõe ao cliente
 */
export const logError = (context: string, error: any, additionalInfo?: any): void => {
  const timestamp = new Date().toISOString();

  console.error(`\n${'='.repeat(80)}`);
  console.error(`❌ ERRO [${timestamp}] - ${context}`);
  console.error(`${'='.repeat(80)}`);

  // Informações do erro
  if (error instanceof Error) {
    console.error('Tipo:', error.name);
    console.error('Mensagem:', error.message);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
  } else {
    console.error('Erro (raw):', error);
  }

  // Informações adicionais
  if (additionalInfo) {
    console.error('\nContexto adicional:');
    console.error(JSON.stringify(additionalInfo, null, 2));
  }

  console.error(`${'='.repeat(80)}\n`);
};

/**
 * Cria resposta de erro padronizada
 */
export const createErrorResponse = (error: any, context: string, defaultMessage?: string) => {
  // Loga erro completo no servidor (com detalhes)
  logError(context, error);

  // Retorna versão sanitizada para o cliente (sem detalhes sensíveis)
  const sanitized = sanitizeError(error, defaultMessage);

  return {
    success: false,
    error: sanitized.message,
    code: sanitized.code,
    // Não incluir stack, paths, ou outras informações internas
  };
};

/**
 * Wrapper para try-catch que automaticamente sanitiza erros
 */
export const safeHandler = async <T>(
  handler: () => Promise<T>,
  context: string,
  defaultMessage?: string
): Promise<{ success: boolean; data?: T; error?: SanitizedError }> => {
  try {
    const data = await handler();
    return { success: true, data };
  } catch (error) {
    logError(context, error);
    const sanitized = sanitizeError(error, defaultMessage);
    return { success: false, error: sanitized };
  }
};

/**
 * Verifica se é ambiente de desenvolvimento
 */
export const isDevelopment = (): boolean => {
  return process.env['NODE_ENV'] !== 'production';
};

/**
 * Em desenvolvimento, pode incluir mais detalhes
 * Em produção, sempre sanitiza
 */
export const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (isDevelopment() && error.message) {
    return error.message;
  }
  return sanitizeError(error, defaultMessage).message;
};
