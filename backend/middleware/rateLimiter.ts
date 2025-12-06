import rateLimit from 'express-rate-limit';

/**
 * Rate limiter geral para APIs
 * 100 requisições por 15 minutos
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true, // Retorna informações no header RateLimit-*
  legacyHeaders: false, // Desabilita headers X-RateLimit-*
});

/**
 * Rate limiter estrito para autenticação
 * 5 tentativas de login por 15 minutos
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para upload de arquivos
 * 20 uploads por 15 minutos
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 uploads por IP
  message: {
    success: false,
    error: 'Muitos uploads. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para criação de recursos
 * 30 criações por 15 minutos (mesas, produtos, categorias)
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 criações por IP
  message: {
    success: false,
    error: 'Muitas operações de criação. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para relatórios e exportações
 * 10 exportações por hora
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 exportações por hora
  message: {
    success: false,
    error: 'Muitas exportações. Tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para operações de pagamento
 * 50 requisições por 15 minutos
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 operações de pagamento
  message: {
    success: false,
    error: 'Muitas operações de pagamento. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para renovação de tokens
 * 5 renovações por 15 minutos
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 renovações apenas
  message: {
    success: false,
    error: 'Muitas tentativas de renovação de token. Aguarde 15 minutos.',
  },
  skipSuccessfulRequests: false, // Conta renovações bem-sucedidas
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  createLimiter,
  reportLimiter,
  paymentLimiter,
  refreshLimiter,
};
