import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User, UserRole } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        role: UserRole;
        isAnonymous: boolean;
      };
      sessionToken?: string;
    }
  }
}

/**
 * Middleware de autenticação dual: aceita JWT ou SessionToken
 * Suporta tanto usuários registrados quanto anônimos
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAnonymous: decoded.isAnonymous,
      };
      return next();
    } catch (jwtError) {
      const user = await User.findOne({
        sessionToken: token,
        sessionExpiry: { $gt: new Date() },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado',
        });
        return;
      }

      req.user = {
        userId: (user._id as any).toString(),
        role: user.role,
        isAnonymous: true,
      };
      req.sessionToken = token;
      return next();
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao autenticar usuário',
    });
  }
};

/**
 * Middleware de autorização por role
 * @param allowedRoles - Roles permitidas para acessar a rota
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Permissão negada',
      });
      return;
    }

    next();
  };
};

export const adminOnly = authorize(UserRole.ADMIN);
export const clientOnly = authorize(UserRole.CLIENT);
export const kitchenOnly = authorize(UserRole.KITCHEN);
export const kitchenOrAdmin = authorize(UserRole.ADMIN, UserRole.KITCHEN);

/**
 * Middleware de autenticação opcional
 * Não retorna erro se não houver token, apenas popula req.user quando disponível
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAnonymous: decoded.isAnonymous,
      };
    } catch {
      const user = await User.findOne({
        sessionToken: token,
        sessionExpiry: { $gt: new Date() },
      });

      if (user) {
        req.user = {
          userId: (user._id as any).toString(),
          role: user.role,
          isAnonymous: true,
        };
        req.sessionToken = token;
      }
    }
  } catch (error) {
    console.error('Erro em autenticação opcional:', error);
  }

  next();
};
