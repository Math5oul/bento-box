import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { IUser } from '../models/User';

/**
 * Payload do JWT Token
 */
export interface JWTPayload {
  userId: string;
  email?: string;
  role: string; // Role ObjectId como string
  isAnonymous: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Gera Access Token (curta duração - 15 minutos)
 */
export const generateAccessToken = (user: IUser): string => {
  // Convert role to string (either enum value or ObjectId string)
  const roleValue = user.role instanceof mongoose.Types.ObjectId ? user.role.toString() : user.role;

  const payload: JWTPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: roleValue,
    isAnonymous: user.isAnonymous,
  };

  const secret = process.env['JWT_SECRET'] || 'fallback-secret';
  const expiresIn = process.env['JWT_ACCESS_EXPIRES'] || '15m'; // 15 minutos

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Gera Refresh Token (longa duração - 7 dias)
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role instanceof mongoose.Types.ObjectId ? user.role.toString() : user.role,
    isAnonymous: user.isAnonymous,
  };

  const secret =
    process.env['JWT_REFRESH_SECRET'] || process.env['JWT_SECRET'] || 'fallback-refresh-secret';
  const expiresIn = process.env['JWT_REFRESH_EXPIRES'] || '7d'; // 7 dias

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Gera JWT Token (mantido para compatibilidade - usa access token)
 * @deprecated Use generateAccessToken e generateRefreshToken
 */
export const generateToken = (user: IUser): string => {
  return generateAccessToken(user);
};

/**
 * Verifica e decodifica Access Token
 */
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env['JWT_SECRET'] || 'fallback-secret';
  return jwt.verify(token, secret) as JWTPayload;
};

/**
 * Verifica e decodifica Refresh Token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  const secret =
    process.env['JWT_REFRESH_SECRET'] || process.env['JWT_SECRET'] || 'fallback-refresh-secret';
  return jwt.verify(token, secret) as JWTPayload;
};

/**
 * Decodifica token sem verificar (útil para debug)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};
