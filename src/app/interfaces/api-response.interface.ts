/**
 * Interface Genérica de Resposta da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/**
 * Interface de Erro da API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * Interface de Resposta Paginada
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

/**
 * Interface de Erro de Validação
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Tipos de Erro HTTP
 */
export enum HttpErrorType {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}
