import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import { User, UserRole } from '../models/User';
import { Table, TableStatus } from '../models/Table';
import { optionalAuth } from '../middleware/auth';
import { validate, runValidations } from '../middleware/validate';

const router = Router();

/**
 * GET /api/table/:tableId/join
 * Acesso à mesa via QR Code (cria sessão anônima)
 */
router.get(
  '/:tableId/join',
  optionalAuth,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      // Busca mesa
      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      // Verifica se mesa está disponível ou ocupada
      if (table.status === TableStatus.CLOSED) {
        res.status(400).json({
          success: false,
          message: 'Mesa fechada para novos clientes',
        });
        return;
      }

      // Se usuário já está autenticado (registrado), vincula à mesa
      if (req.user && !req.user.isAnonymous) {
        const user = await User.findById(req.user.userId);

        if (user) {
          // Adiciona cliente à mesa se não estiver já
          if (!table.clients.includes(user._id as any)) {
            table.clients.push(user._id as any);
            await table.save();
          }

          // Atualiza mesa atual do usuário
          user.currentTableId = table._id as any;
          await user.save();

          res.json({
            success: true,
            message: 'Vinculado à mesa com sucesso',
            table: {
              id: table._id,
              number: table.number,
              status: table.status,
            },
            user: {
              id: user._id,
              name: user.name,
              isAnonymous: false,
            },
          });
          return;
        }
      }

      // Cria sessão anônima
      const anonymousUser = new User({
        name: `Cliente Mesa ${table.number}`,
        role: UserRole.CLIENT,
        isAnonymous: true,
        currentTableId: table._id,
      });

      // Gera session token
      const sessionToken = anonymousUser.generateSessionToken();
      await anonymousUser.save();

      // Adiciona sessão anônima à mesa
      table.anonymousClients.push({
        sessionId: (anonymousUser._id as any).toString(),
        sessionToken,
        joinedAt: new Date(),
        expiresAt: anonymousUser.sessionExpiry!,
        deviceInfo: req.headers['user-agent'],
      });

      // Atualiza status da mesa se estava disponível
      if (table.status === TableStatus.AVAILABLE) {
        table.status = TableStatus.OCCUPIED;
      }

      await table.save();

      res.json({
        success: true,
        message: 'Sessão anônima criada com sucesso',
        sessionToken,
        sessionExpiry: anonymousUser.sessionExpiry,
        table: {
          id: table._id,
          number: table.number,
          status: table.status,
        },
        user: {
          id: anonymousUser._id,
          name: anonymousUser.name,
          isAnonymous: true,
        },
      });
    } catch (error) {
      console.error('Erro ao entrar na mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao acessar mesa',
      });
    }
  }
);

export default router;
