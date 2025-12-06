import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { User, UserRole } from '../models/User';
import { Table } from '../models/Table';
import { Order } from '../models/Order';
import { generateToken } from '../utils/jwt';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, runValidations } from '../middleware/validate';

const router = Router();

// Sistema de controle de tentativas de login
interface LoginAttempt {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Configurações de rate limiting
const MAX_LOGIN_ATTEMPTS = 5; // Máximo de tentativas
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos em ms
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutos de bloqueio

/**
 * Verifica se o IP está bloqueado
 */
function isBlocked(ip: string): { blocked: boolean; remainingTime?: number } {
  const attempt = loginAttempts.get(ip);

  if (!attempt || !attempt.blockedUntil) {
    return { blocked: false };
  }

  const now = new Date();
  if (now < attempt.blockedUntil) {
    const remainingTime = Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000 / 60);
    return { blocked: true, remainingTime };
  }

  // Bloqueio expirou, limpa os dados
  loginAttempts.delete(ip);
  return { blocked: false };
}

/**
 * Registra uma tentativa de login
 */
function recordLoginAttempt(ip: string, success: boolean): void {
  const now = new Date();
  const attempt = loginAttempts.get(ip);

  if (success) {
    // Login bem-sucedido, limpa as tentativas
    loginAttempts.delete(ip);
    return;
  }

  if (!attempt) {
    // Primeira tentativa falha
    loginAttempts.set(ip, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return;
  }

  // Verifica se está dentro da janela de tempo
  const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();

  if (timeSinceFirst > ATTEMPT_WINDOW) {
    // Janela de tempo expirou, reinicia contagem
    loginAttempts.set(ip, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return;
  }

  // Incrementa contador
  attempt.count++;
  attempt.lastAttempt = now;

  // Bloqueia se excedeu o limite
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.blockedUntil = new Date(now.getTime() + BLOCK_DURATION);
    console.log(
      `🚫 IP ${ip} bloqueado por ${BLOCK_DURATION / 1000 / 60} minutos após ${attempt.count} tentativas falhas`
    );
  }

  loginAttempts.set(ip, attempt);
}

/**
 * Obtém tentativas restantes
 */
function getRemainingAttempts(ip: string): number {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return MAX_LOGIN_ATTEMPTS;

  const timeSinceFirst = new Date().getTime() - attempt.firstAttempt.getTime();
  if (timeSinceFirst > ATTEMPT_WINDOW) {
    return MAX_LOGIN_ATTEMPTS;
  }

  return Math.max(0, MAX_LOGIN_ATTEMPTS - attempt.count);
}

// Limpa tentativas antigas a cada 1 hora
setInterval(
  () => {
    const now = new Date();
    for (const [ip, attempt] of loginAttempts.entries()) {
      const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();
      const isExpired = timeSinceFirst > ATTEMPT_WINDOW;
      const blockExpired = attempt.blockedUntil && now > attempt.blockedUntil;

      if (isExpired || blockExpired) {
        loginAttempts.delete(ip);
      }
    }
  },
  60 * 60 * 1000
); // A cada 1 hora

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post(
  '/register',
  runValidations([
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Senhas não conferem');
      }
      return true;
    }),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role } = req.body;

      // Verifica se email já existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Email já cadastrado',
        });
        return;
      }

      // Se role foi fornecido, validar (aceita enum ou ObjectId)
      let userRole = UserRole.CLIENT; // Default
      console.log('🔍 DEBUG Register - role recebido:', role, 'tipo:', typeof role);

      if (role) {
        const validEnumRoles = ['user', 'admin', 'cozinha', 'garçom', 'garcom', 'client', 'table'];
        const isEnumRole = validEnumRoles.includes(role);
        const isObjectId = mongoose.Types.ObjectId.isValid(role);

        console.log('🔍 isEnumRole:', isEnumRole, 'isObjectId:', isObjectId);

        if (isEnumRole) {
          userRole = role === 'garçom' ? 'garcom' : role;
          console.log('✅ Usando enum role:', userRole);
        } else if (isObjectId) {
          // Verificar se o role existe
          const { Role } = await import('../models');
          const roleExists = await Role.findById(role);
          console.log('🔍 Role encontrado no banco:', roleExists?.name);
          if (roleExists) {
            userRole = role; // Use ObjectId directly
            console.log('✅ Usando ObjectId role:', userRole);
          } else {
            console.log('❌ Role não encontrado no banco');
          }
        } else {
          console.log('❌ Role inválido - não é enum nem ObjectId');
        }
      }

      console.log('📝 Criando usuário com role:', userRole);

      // Cria novo usuário
      const user = new User({
        name,
        email,
        password,
        role: userRole,
        isAnonymous: false,
      });

      await user.save();

      // Popular roleDetails se role for ObjectId
      let populatedUser: any = user;
      if (mongoose.Types.ObjectId.isValid(user.role)) {
        const populated = await User.findById(user._id).populate('role').lean();
        if (populated) {
          populatedUser = populated;
        }
      }

      // Gera token JWT
      const token = generateToken(user);

      // Remove senha da resposta
      const userResponse: any = populatedUser?.toObject
        ? populatedUser.toObject()
        : { ...populatedUser };
      delete userResponse.password;

      // Adicionar permissions para acesso rápido no frontend
      if (
        userResponse.role &&
        typeof userResponse.role === 'object' &&
        'permissions' in userResponse.role
      ) {
        userResponse.roleDetails = userResponse.role;
        userResponse.permissions = userResponse.role.permissions;
      }

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar usuário',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login de usuário registrado
 */
router.post(
  '/login',
  runValidations([
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';

      // Verifica se o IP está bloqueado
      const blockStatus = isBlocked(clientIp);
      if (blockStatus.blocked) {
        res.status(429).json({
          success: false,
          message: `Muitas tentativas de login falhas. Tente novamente em ${blockStatus.remainingTime} minutos.`,
          remainingTime: blockStatus.remainingTime,
          blockedUntil: loginAttempts.get(clientIp)?.blockedUntil,
        });
        return;
      }

      // Busca usuário com senha (select: false por padrão)
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        recordLoginAttempt(clientIp, false);
        const remaining = getRemainingAttempts(clientIp);
        res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
          remainingAttempts: remaining,
        });
        return;
      }

      // Verifica senha
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        recordLoginAttempt(clientIp, false);
        const remaining = getRemainingAttempts(clientIp);
        res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
          remainingAttempts: remaining,
        });
        return;
      }

      // Login bem-sucedido - limpa tentativas
      recordLoginAttempt(clientIp, true);

      // Popular roleDetails se role for ObjectId
      let populatedUser: any = user;
      console.log(
        '[Login] User role:',
        user.role,
        'isObjectId:',
        mongoose.Types.ObjectId.isValid(user.role)
      );

      if (mongoose.Types.ObjectId.isValid(user.role)) {
        const populated = await User.findById(user._id).select('+password').populate('role').lean();
        console.log('[Login] Populated user:', JSON.stringify(populated, null, 2));
        if (populated) {
          populatedUser = populated;
        }
      }

      // Gera token JWT
      const token = generateToken(user);

      // Remove senha da resposta
      const userResponse: any = populatedUser?.toObject
        ? populatedUser.toObject()
        : { ...populatedUser };
      delete userResponse.password;

      console.log('[Login] userResponse.role type:', typeof userResponse.role);
      console.log('[Login] userResponse.role:', userResponse.role);

      // Adicionar permissions para acesso rápido no frontend
      if (
        userResponse.role &&
        typeof userResponse.role === 'object' &&
        'permissions' in userResponse.role
      ) {
        console.log('[Login] Adding permissions to response');
        userResponse.roleDetails = userResponse.role;
        userResponse.permissions = userResponse.role.permissions;
      } else {
        console.log('[Login] NOT adding permissions - role is not object or no permissions field');
      }

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao realizar login',
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout (apenas limpa token no frontend)
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
});

/**
 * POST /api/auth/change-password
 * Altera senha do usuário autenticado
 */
router.post(
  '/change-password',
  authenticate,
  runValidations([
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Senhas não conferem');
      }
      return true;
    }),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      // Busca usuário com senha
      const user = await User.findById(userId).select('+password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
        return;
      }

      // Verifica senha atual
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Senha atual incorreta',
        });
        return;
      }

      // Atualiza senha
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar senha',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário',
    });
  }
});

/**
 * POST /api/auth/convert-anonymous
 * Converte sessão anônima em conta registrada
 */
router.post(
  '/convert-anonymous',
  runValidations([
    body('sessionToken').notEmpty().withMessage('Session token é obrigatório'),
    body('action').isIn(['login', 'register']).withMessage('Action deve ser login ou register'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionToken, action, loginData, registerData } = req.body;

      // Busca usuário anônimo
      const anonymousUser = await User.findOne({
        sessionToken,
        isAnonymous: true,
        sessionExpiry: { $gt: new Date() },
      });

      if (!anonymousUser) {
        res.status(404).json({
          success: false,
          message: 'Sessão anônima não encontrada ou expirada',
        });
        return;
      }

      let targetUser;

      if (action === 'login') {
        // Login em conta existente
        if (!loginData || !loginData.email || !loginData.password) {
          res.status(400).json({
            success: false,
            message: 'Email e senha são obrigatórios para login',
          });
          return;
        }

        targetUser = await User.findOne({ email: loginData.email }).select('+password');

        if (!targetUser || !(await targetUser.comparePassword(loginData.password))) {
          res.status(401).json({
            success: false,
            message: 'Email ou senha incorretos',
          });
          return;
        }
      } else {
        // Criar nova conta
        if (!registerData || !registerData.name || !registerData.email || !registerData.password) {
          res.status(400).json({
            success: false,
            message: 'Nome, email e senha são obrigatórios para registro',
          });
          return;
        }

        // Verifica se email já existe
        const existingUser = await User.findOne({ email: registerData.email });
        if (existingUser) {
          res.status(409).json({
            success: false,
            message: 'Email já cadastrado',
          });
          return;
        }

        // Cria nova conta
        targetUser = new User({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          role: UserRole.CLIENT,
          isAnonymous: false,
        });

        await targetUser.save();
      }

      // Transfere pedidos da sessão anônima para a conta
      await Order.updateMany(
        { sessionToken },
        {
          $set: {
            clientId: targetUser._id,
            clientName: targetUser.name,
          },
          $unset: { sessionToken: 1 },
        }
      );

      // Atualiza mesa para vincular usuário
      if (anonymousUser.currentTableId) {
        await Table.updateOne(
          { _id: anonymousUser.currentTableId },
          {
            $pull: { anonymousClients: { sessionToken } },
            $addToSet: { clients: targetUser._id },
          }
        );

        // Atualiza tableId do usuário
        targetUser.currentTableId = anonymousUser.currentTableId;
        await targetUser.save();
      }

      // Remove usuário anônimo
      await User.deleteOne({ _id: anonymousUser._id });

      // Gera token JWT
      const token = generateToken(targetUser);

      // Remove senha da resposta
      const userResponse = targetUser.toObject();
      delete userResponse.password;

      // Busca informações da mesa se houver
      let tableInfo = null;
      if (targetUser.currentTableId) {
        const table = await Table.findById(targetUser.currentTableId);
        if (table) {
          tableInfo = {
            tableId: (table._id as any).toString(),
            tableNumber: table.number,
          };
        }
      }

      res.json({
        success: true,
        message: 'Sessão convertida com sucesso',
        token,
        user: userResponse,
        table: tableInfo,
      });
    } catch (error) {
      console.error('Erro ao converter sessão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao converter sessão anônima',
      });
    }
  }
);

export default router;
