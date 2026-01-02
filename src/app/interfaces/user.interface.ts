import { Role, RolePermissions } from './role.interface';

/**
 * Interface de Usuário do Sistema
 * Suporta usuários registrados e anônimos (via QR Code)
 */
export interface User {
  id: string;
  email?: string; // Opcional para usuários anônimos
  password?: string; // Hash bcrypt, opcional para anônimos
  name: string;
  role: string; // ObjectId de Role no banco
  roleDetails?: Role; // Role populado com permissões
  permissions?: RolePermissions; // Permissões diretas para acesso rápido
  isAnonymous: boolean; // true se for cliente genérico via QR Code
  createdAt: Date;
  updatedAt: Date;

  // Apenas para role: CLIENT (registrados)
  paymentMethods?: PaymentMethod[];
  orderHistory?: string[]; // Array de Order IDs
  currentTableId?: string;

  // Sessão temporária para anônimos
  sessionToken?: string; // Token único da sessão
  sessionExpiry?: Date; // Quando expira a sessão (24h padrão)
}

/**
 * Payload do JWT Token
 */
export interface JWTPayload {
  userId: string;
  email?: string;
  role: string; // ObjectId de Role
  isAnonymous: boolean;
  iat: number; // Issued at
  exp: number; // Expiration
}

/**
 * Response do Login/Registro
 */
export interface AuthResponse {
  success: boolean;
  token: string; // JWT ou sessionToken
  user: Omit<User, 'password'>; // Retorna user sem senha
  message?: string;
}

/**
 * DTO para Login
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * DTO para Registro
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * DTO para Conversão de Sessão Anônima
 */
export interface ConvertAnonymousDTO {
  sessionToken: string;
  // Opção 1: Fazer login em conta existente
  loginCredentials?: {
    email: string;
    password: string;
  };
  // Opção 2: Criar nova conta
  registerData?: {
    name: string;
    email: string;
    password: string;
  };
}

/**
 * Interface de Método de Pagamento
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentType;

  // Para cartão
  cardNumber: string; // Últimos 4 dígitos apenas (ex: "****1234")
  cardHolderName: string;
  expiryDate: string; // MM/YY
  brand: CardBrand; // Visa, Mastercard, etc

  // Token do gateway de pagamento (Stripe/PagSeguro)
  token?: string;

  isDefault: boolean;
  createdAt: Date;
}

/**
 * Enum de Tipos de Pagamento
 */
export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  CASH = 'cash',
}

/**
 * Enum de Bandeiras de Cartão
 */
export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  ELO = 'elo',
  AMEX = 'amex',
  HIPERCARD = 'hipercard',
  DISCOVER = 'discover',
}
