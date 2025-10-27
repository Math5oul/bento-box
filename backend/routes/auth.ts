import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { User, UserRole } from '../models/User';
import { Table } from '../models/Table';
import { Order } from '../models/Order';
import { generateToken } from '../utils/jwt';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, runValidations } from '../middleware/validate';

const router = Router();

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
      const { name, email, password } = req.body;

      // Verifica se email já existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Email já cadastrado',
        });
        return;
      }

      // Cria novo usuário
      const user = new User({
        name,
        email,
        password,
        role: UserRole.CLIENT,
        isAnonymous: false,
      });

      await user.save();

      // Gera token JWT
      const token = generateToken(user);

      // Remove senha da resposta
      const userResponse = user.toObject();
      delete userResponse.password;

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

      // Busca usuário com senha (select: false por padrão)
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
        });
        return;
      }

      // Verifica senha
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
        });
        return;
      }

      // Gera token JWT
      const token = generateToken(user);

      // Remove senha da resposta
      const userResponse = user.toObject();
      delete userResponse.password;

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
          $set: { clientId: targetUser._id },
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
