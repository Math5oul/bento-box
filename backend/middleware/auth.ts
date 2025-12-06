import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User, UserRole } from '../models/User';
import { Role, IRolePermissions, DEFAULT_PERMISSIONS } from '../models/Role';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        role: UserRole | string; // Can be enum or ObjectId string
        isAnonymous: boolean;
        permissions?: IRolePermissions; // Dynamic permissions from Role document
      };
      sessionToken?: string;
    }
  }
}

/**
 * Helper function to load permissions for a user
 */
async function loadUserPermissions(
  role: UserRole | string | mongoose.Types.ObjectId
): Promise<IRolePermissions | undefined> {
  // If role is a static enum value, return default permissions
  if (typeof role === 'string' && Object.values(UserRole).includes(role as UserRole)) {
    const roleKey =
      role === UserRole.WAITER ? 'waiter' : role === UserRole.KITCHEN ? 'kitchen' : role;
    return DEFAULT_PERMISSIONS[roleKey];
  }

  // If role is an ObjectId, fetch the Role document
  try {
    const roleDoc = await Role.findById(role);
    return roleDoc?.permissions;
  } catch (error) {
    console.error('Error loading role permissions:', error);
    return undefined;
  }
}

/**
 * Middleware de autenticação dual: aceita JWT ou SessionToken
 * Suporta tanto usuários registrados quanto anônimos
 * Prioridade: 1) Cookie httpOnly, 2) Authorization header (fallback)
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = req.cookies?.['access_token'];
    const legacyToken = req.cookies?.['auth_token']; // Backward compatibility

    // Prioriza access_token, fallback para auth_token (legado), depois Authorization header
    const token =
      accessToken || legacyToken || (authHeader ? authHeader.replace('Bearer ', '') : null);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
      return;
    }

    try {
      const decoded = verifyToken(token);
      const permissions = await loadUserPermissions(decoded.role);

      console.log('[AUTH] User authenticated:', {
        userId: decoded.userId,
        role: decoded.role,
        hasPermissions: !!permissions,
        canManageOrders: permissions?.canManageOrders,
      });

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAnonymous: decoded.isAnonymous,
        permissions,
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

      // Convert role to string (either enum value or ObjectId string)
      const roleValue =
        user.role instanceof mongoose.Types.ObjectId ? user.role.toString() : user.role;

      const permissions = await loadUserPermissions(user.role);

      req.user = {
        userId: (user._id as any).toString(),
        role: roleValue,
        isAnonymous: true,
        permissions,
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

    // Check if role matches any allowed role (handle both enum and string)
    const userRole = req.user.role as string;
    const allowedRoleStrings = allowedRoles.map(role => role as string);

    if (!allowedRoleStrings.includes(userRole)) {
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
 * Helper function to check if user has a specific permission
 */
export function hasPermission(req: Request, permissionKey: keyof IRolePermissions): boolean {
  if (!req.user) return false;

  // Legacy check: admin role has all permissions
  if (req.user.role === UserRole.ADMIN || req.user.role === 'admin') {
    return true;
  }

  // Check dynamic permissions
  return req.user.permissions?.[permissionKey] === true;
}

/**
 * Middleware to require a specific permission
 */
export const requirePermission = (permissionKey: keyof IRolePermissions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    if (!hasPermission(req, permissionKey)) {
      res.status(403).json({
        success: false,
        message: 'Acesso negado',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de autenticação opcional
 * Não retorna erro se não houver token, apenas popula req.user quando disponível
 * Prioridade: 1) Cookie httpOnly, 2) Authorization header (fallback)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const accessToken = req.cookies?.['access_token'];
  const legacyToken = req.cookies?.['auth_token']; // Backward compatibility

  // Prioriza access_token, fallback para auth_token (legado), depois Authorization header
  const token =
    accessToken || legacyToken || (authHeader ? authHeader.replace('Bearer ', '') : null);

  if (!token) {
    return next();
  }

  try {
    try {
      const decoded = verifyToken(token);
      const permissions = await loadUserPermissions(decoded.role);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAnonymous: decoded.isAnonymous,
        permissions,
      };
    } catch {
      const user = await User.findOne({
        sessionToken: token,
        sessionExpiry: { $gt: new Date() },
      });

      if (user) {
        // Convert role to string (either enum value or ObjectId string)
        const roleValue =
          user.role instanceof mongoose.Types.ObjectId ? user.role.toString() : user.role;

        const permissions = await loadUserPermissions(user.role);

        req.user = {
          userId: (user._id as any).toString(),
          role: roleValue,
          isAnonymous: true,
          permissions,
        };
        req.sessionToken = token;
      }
    }
  } catch (error) {
    console.error('Erro em autenticação opcional:', error);
  }

  next();
};
