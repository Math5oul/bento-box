import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';
import { auditLog } from '../middleware/auditLogger';
import { logError, sanitizeError } from '../utils/errorSanitizer';

const router = Router();

/**
 * @route   GET /api/admin/users
 * @desc    Listar todos os usuários (apenas admin)
 * @access  Private/Admin
 */
router.get('/users', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar permissão: canViewUsers OU canManageUsers
    // canViewUsers: pode listar usuários (ex: garçom criando pedido no balcão)
    // canManageUsers: pode fazer CRUD completo de usuários (ex: admin)
    const canView = req.user?.permissions?.canViewUsers === true;
    const canManage = req.user?.permissions?.canManageUsers === true;

    if (!canView && !canManage) {
      res
        .status(403)
        .json({ message: 'Acesso negado. Permissão canViewUsers ou canManageUsers necessária.' });
      return;
    }

    // Buscar todos os usuários (sem senha) com role populated
    const users = await User.find().select('-password').populate('role', 'name slug clientLevel'); // Popular role com campos necessários

    res.json(users);
  } catch (error) {
    logError('GET /api/admin/users', error);
    const sanitized = sanitizeError(error, 'Erro ao buscar usuários');
    res.status(sanitized.statusCode).json({
      success: false,
      message: sanitized.message,
    });
  }
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Alterar role de um usuário (apenas admin)
 * @access  Private/Admin
 */
router.patch(
  '/users/:id/role',
  authenticate,
  auditLog('UPDATE_USER_ROLE', 'users'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar permissão: canManageUsers ou canManageRoles
      const canManageUsers = req.user?.permissions?.canManageUsers === true;
      const canManageRoles = req.user?.permissions?.canManageRoles === true;

      if (!canManageUsers && !canManageRoles) {
        res.status(403).json({ message: 'Acesso negado' });
        return;
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        res.status(400).json({
          message: 'Role é obrigatória.',
        });
        return;
      }

      // Validar role: aceita enum antigo OU ObjectId de role novo
      const validEnumRoles = ['user', 'admin', 'cozinha', 'garçom', 'garcom', 'client', 'table'];
      const isEnumRole = validEnumRoles.includes(role);
      const isObjectId = mongoose.Types.ObjectId.isValid(role);

      if (!isEnumRole && !isObjectId) {
        res.status(400).json({
          message: 'Role inválida. Use um dos valores enum ou um ID de role válido.',
        });
        return;
      }

      // Se for ObjectId, verificar se o role existe
      if (isObjectId) {
        const { Role } = await import('../models');
        const roleExists = await Role.findById(role);
        if (!roleExists) {
          res.status(400).json({
            message: 'Role não encontrada no sistema.',
          });
          return;
        }
      }

      // Normalizar "garçom" para "garcom" se for enum (padrão do banco)
      const normalizedRole = role === 'garçom' ? 'garcom' : role;

      // Impedir que o admin altere sua própria role
      if (id === req.user?.userId) {
        res.status(400).json({ message: 'Você não pode alterar sua própria role.' });
        return;
      }

      // Atualizar role
      const user = await User.findByIdAndUpdate(id, { role: normalizedRole }, { new: true }).select(
        '-password'
      );

      if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      res.json({ message: 'Role atualizada com sucesso', user });
    } catch (error) {
      logError('PATCH /api/admin/users/:id/role', error);
      const sanitized = sanitizeError(error, 'Erro ao atualizar role');
      res.status(sanitized.statusCode).json({
        success: false,
        message: sanitized.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deletar um usuário (apenas admin)
 * @access  Private/Admin
 */
router.delete(
  '/users/:id',
  authenticate,
  auditLog('DELETE_USER', 'users'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar permissão: canManageUsers
      const canManage = req.user?.permissions?.canManageUsers === true;

      if (!canManage) {
        res.status(403).json({ message: 'Acesso negado' });
        return;
      }

      const { id } = req.params;

      // Impedir que o admin delete sua própria conta
      if (id === req.user?.userId) {
        res.status(400).json({ message: 'Você não pode deletar sua própria conta.' });
        return;
      }

      // Deletar usuário
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      logError('DELETE /api/admin/users/:id', error);
      const sanitized = sanitizeError(error, 'Erro ao deletar usuário');
      res.status(sanitized.statusCode).json({
        success: false,
        message: sanitized.message,
      });
    }
  }
);

export default router;
