import jwt from 'jsonwebtoken';
import { IUser, UserRole } from '../models/User';

/**
 * Payload do JWT Token
 */
export interface JWTPayload {
  userId: string;
  email?: string;
  role: UserRole;
  isAnonymous: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Gera JWT Token para usuário registrado
 */
export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    isAnonymous: user.isAnonymous,
  };

  const secret = process.env['JWT_SECRET'] || 'fallback-secret';
  const expiresIn = process.env['JWT_EXPIRES_IN'] || '24h';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Verifica e decodifica JWT Token
 */
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env['JWT_SECRET'] || 'fallback-secret';
  return jwt.verify(token, secret) as JWTPayload;
};

/**
 * Decodifica token sem verificar (útil para debug)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};
