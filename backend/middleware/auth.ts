import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User, UserRole } from '../models/User';

/**
 * Estende Request do Express para incluir user
 */
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
 * Middleware de Autenticação Dual (JWT ou SessionToken)
 * Aceita tanto usuários registrados quanto anônimos
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Busca token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Tenta verificar como JWT primeiro
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
      // Se não for JWT válido, verifica se é sessionToken
      const user = await User.findOne({
        sessionToken: token,
        sessionExpiry: { $gt: new Date() }, // Não expirado
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado',
        });
        return;
      }

      // Usuário anônimo válido
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
 * Middleware de Autorização por Role
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

/**
 * Middleware: Apenas Admins
 */
export const adminOnly = authorize(UserRole.ADMIN);

/**
 * Middleware: Apenas Clientes (registrados e anônimos)
 */
export const clientOnly = authorize(UserRole.CLIENT);

/**
 * Middleware: Autenticação Opcional
 * Não retorna erro se não tiver token, apenas popula req.user se tiver
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

    // Tenta JWT
    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAnonymous: decoded.isAnonymous,
      };
    } catch {
      // Tenta sessionToken
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
