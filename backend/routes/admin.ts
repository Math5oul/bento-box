import { Router, Request, Response } from 'express';
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
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
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
      // Verificar se o usuário é admin
      if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        return;
      }

      const { id } = req.params;
      const { role } = req.body;

      // Validar role
      if (!role || !['user', 'admin'].includes(role)) {
        res.status(400).json({ message: 'Role inválida. Use "user" ou "admin".' });
        return;
      }

      // Impedir que o admin altere sua própria role
      if (id === req.user?.userId) {
        res.status(400).json({ message: 'Você não pode alterar sua própria role.' });
        return;
      }

      // Atualizar role
      const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');

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
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
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
