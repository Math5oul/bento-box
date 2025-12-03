import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/admin/users
 * @desc    Listar todos os usuários (apenas admin)
 * @access  Private/Admin
 */
router.get('/users', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar permissão: canManageUsers (ou legacy admin)
    const canManage = req.user?.permissions?.canManageUsers === true;
    const isLegacyAdmin = req.user?.role === 'admin';

    if (!canManage && !isLegacyAdmin) {
      res.status(403).json({ message: 'Acesso negado' });
      return;
    }

    // Buscar todos os usuários (sem senha)
    const users = await User.find().select('-password');

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários', error });
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar permissão: canManageUsers ou canManageRoles (ou legacy admin)
      const canManageUsers = req.user?.permissions?.canManageUsers === true;
      const canManageRoles = req.user?.permissions?.canManageRoles === true;
      const isLegacyAdmin = req.user?.role === 'admin';

      if (!canManageUsers && !canManageRoles && !isLegacyAdmin) {
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
      console.error('Erro ao atualizar role:', error);
      res.status(500).json({ message: 'Erro ao atualizar role', error });
    }
  }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deletar um usuário (apenas admin)
 * @access  Private/Admin
 */
router.delete('/users/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar permissão: canManageUsers (ou legacy admin)
    const canManage = req.user?.permissions?.canManageUsers === true;
    const isLegacyAdmin = req.user?.role === 'admin';

    if (!canManage && !isLegacyAdmin) {
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
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário', error });
  }
});

export default router;
