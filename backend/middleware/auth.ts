import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User } from '../models/User';
import { Role, IRolePermissions, DEFAULT_PERMISSIONS } from '../models/Role';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        role: string; // Role ObjectId como string
        isAnonymous: boolean;
        permissions?: IRolePermissions;
      };
      sessionToken?: string;
    }
  }
}

/**
 * Helper function to load permissions for a user
 */
async function loadUserPermissions(
  role: string | mongoose.Types.ObjectId
): Promise<IRolePermissions | undefined> {
  try {
    const roleDoc = await Role.findById(role);
    if (roleDoc) {
      return roleDoc.permissions;
    }
    
    // Fallback para role por slug se for string legível
    if (typeof role === 'string' && role.length < 24) {
      const roleBySlug = await Role.findOne({ slug: role });
      return roleBySlug?.permissions;
    }
    
    return undefined;
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
 * @param allowedRoleSlugs - Slugs dos roles permitidos (ex: 'admin', 'garcom', 'cozinha')
 */
export const authorize = (...allowedRoleSlugs: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    try {
      // Busca o role do usuário no banco
      const roleDoc = await Role.findById(req.user.role);
      
      if (!roleDoc) {
        res.status(403).json({
          success: false,
          message: 'Role não encontrado',
        });
        return;
      }

      // Verifica se o slug do role está na lista de permitidos
      if (!allowedRoleSlugs.includes(roleDoc.slug)) {
        res.status(403).json({
          success: false,
          message: 'Permissão negada',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar autorização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões',
      });
    }
  };
};

export const adminOnly = authorize('admin');
export const clientOnly = authorize('cliente', 'cliente-vip');
export const kitchenOnly = authorize('cozinha');
export const kitchenOrAdmin = authorize('admin', 'cozinha');

/**
 * Helper function to check if user has a specific permission
 */
export async function hasPermission(req: Request, permissionKey: keyof IRolePermissions): Promise<boolean> {
  if (!req.user) return false;

  // Busca role do banco para verificar se é admin
  try {
    const roleDoc = await Role.findById(req.user.role);
    
    // Admin tem todas as permissões
    if (roleDoc?.slug === 'admin') {
      return true;
    }
  } catch (error) {
    console.error('Erro ao verificar role:', error);
  }

  // Verifica permissões dinâmicas
  return req.user.permissions?.[permissionKey] === true;
}

/**
 * Middleware to require a specific permission
 */
export const requirePermission = (permissionKey: keyof IRolePermissions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const hasPerm = await hasPermission(req, permissionKey);
    if (!hasPerm) {
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

  // Prioriza access_token, fallback para auth_token (legado), depois Authorization header
  const token =
    accessToken || (authHeader ? authHeader.replace('Bearer ', '') : null);

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
