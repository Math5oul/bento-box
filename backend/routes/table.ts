import { Router, Request, Response } from 'express';
import { param, body } from 'express-validator';
import { User, UserRole } from '../models/User';
import { Table, TableStatus } from '../models/Table';
import { Order } from '../models/Order';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, runValidations } from '../middleware/validate';
import QRCode from 'qrcode';

const router = Router();

/**
 * GET /api/tables
 * Lista todas as mesas (Admin e público)
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const tables = await Table.find().sort({ number: 1 });

    // Transformar _id em id para compatibilidade com frontend
    const tablesFormatted = tables.map(table => ({
      ...table.toObject(),
      id: (table._id as any).toString(),
    }));

    res.json({
      success: true,
      tables: tablesFormatted,
    });
  } catch (error) {
    console.error('Erro ao listar mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar mesas',
    });
  }
});

/**
 * POST /api/tables
 * Cria uma nova mesa (Admin)
 */
router.post(
  '/',
  authenticate,
  runValidations([
    body('number').isInt({ min: 1 }).withMessage('Número da mesa deve ser maior que 0'),
    body('capacity').optional().isInt({ min: 1, max: 20 }).withMessage('Capacidade inválida'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { number, capacity = 4 } = req.body;

      // Verifica se mesa já existe
      const existingTable = await Table.findOne({ number });
      if (existingTable) {
        res.status(409).json({
          success: false,
          message: 'Já existe uma mesa com este número',
        });
        return;
      }

      // Cria nova mesa
      const table = new Table({
        number,
        capacity,
        status: TableStatus.AVAILABLE,
        qrCode: `/table/${number}/join`, // Será atualizado após criar
        clients: [],
        anonymousClients: [],
        currentOrders: [],
        totalConsumption: 0,
      });

      await table.save();

      // Atualiza QR Code com ID real
      table.qrCode = `/table/${table._id}/join`;
      await table.save();

      res.status(201).json({
        success: true,
        message: 'Mesa criada com sucesso',
        table: {
          ...table.toObject(),
          id: (table._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar mesa',
      });
    }
  }
);

/**
 * DELETE /api/tables/:tableId
 * Exclui uma mesa (Admin)
 */
router.delete(
  '/:tableId',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      // Não permite excluir mesa ocupada
      if (table.status === TableStatus.OCCUPIED) {
        res.status(400).json({
          success: false,
          message: 'Não é possível excluir mesa ocupada',
        });
        return;
      }

      await Table.findByIdAndDelete(tableId);

      res.json({
        success: true,
        message: 'Mesa excluída com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir mesa',
      });
    }
  }
);

/**
 * POST /api/tables/:tableId/open
 * Abre uma mesa (Admin)
 */
router.post(
  '/:tableId/open',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      table.status = TableStatus.OCCUPIED;
      table.openedAt = new Date();
      if (req.user?.userId) {
        table.openedBy = req.user.userId as any;
      }
      await table.save();

      res.json({
        success: true,
        message: 'Mesa aberta com sucesso',
        table: {
          ...table.toObject(),
          id: (table._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao abrir mesa',
      });
    }
  }
);

/**
 * POST /api/tables/:tableId/close
 * Fecha uma mesa (Admin) - Libera a mesa e limpa dados
 */
router.post(
  '/:tableId/close',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      console.log('🔒 Tentando fechar mesa:', tableId);

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      console.log('📋 Mesa encontrada:', { number: table.number, status: table.status });

      // Fecha a mesa mas mantém os dados para pagamento
      table.status = TableStatus.CLOSED;
      table.closedAt = new Date();

      await table.save();

      console.log('✅ Mesa fechada com sucesso:', { number: table.number, status: table.status });

      res.json({
        success: true,
        message: 'Mesa fechada com sucesso',
        table: {
          ...table.toObject(),
          id: (table._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fechar mesa',
      });
    }
  }
);

/**
 * POST /api/tables/:tableId/clear
 * Libera uma mesa (Admin) - Limpa dados e volta para disponível
 */
router.post(
  '/:tableId/clear',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      console.log('🧹 Tentando liberar mesa:', tableId);

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      console.log('📋 Mesa encontrada:', { number: table.number, status: table.status });

      // Limpa a mesa e volta para disponível
      table.status = TableStatus.AVAILABLE;
      table.clients = [];
      table.anonymousClients = [];
      table.currentOrders = [];
      table.totalConsumption = 0;
      table.openedAt = undefined;
      table.openedBy = undefined;
      table.closedAt = undefined;
      (table as any).reservationInfo = undefined;

      await table.save();

      console.log('✅ Mesa liberada com sucesso:', { number: table.number, status: table.status });

      res.json({
        success: true,
        message: 'Mesa liberada com sucesso',
        table: {
          ...table.toObject(),
          id: (table._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao liberar mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao liberar mesa',
      });
    }
  }
);

/**
 * POST /api/tables/:tableId/reserve
 * Reserva uma mesa (Admin)
 */
router.post(
  '/:tableId/reserve',
  authenticate,
  runValidations([
    param('tableId').isMongoId().withMessage('ID da mesa inválido'),
    body('clientName').notEmpty().withMessage('Nome do cliente é obrigatório'),
    body('clientPhone').notEmpty().withMessage('Telefone é obrigatório'),
    body('dateTime').isISO8601().withMessage('Data/hora inválida'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;
      const { clientName, clientPhone, dateTime, notes } = req.body;

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      if (table.status !== TableStatus.AVAILABLE) {
        res.status(400).json({
          success: false,
          message: 'Mesa não está disponível para reserva',
        });
        return;
      }

      // Atualiza status da mesa
      table.status = TableStatus.RESERVED;

      // Armazena informações da reserva (você pode criar um modelo Reservation separado se preferir)
      (table as any).reservationInfo = {
        clientName,
        clientPhone,
        dateTime: new Date(dateTime),
        notes,
        createdAt: new Date(),
        createdBy: req.user?.userId,
      };

      await table.save();

      res.json({
        success: true,
        message: 'Mesa reservada com sucesso',
        table: {
          ...table.toObject(),
          id: (table._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao reservar mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao reservar mesa',
      });
    }
  }
);

/**
 * GET /api/tables/:tableId/qrcode
 * Gera QR Code da mesa (Admin)
 */
router.get(
  '/:tableId/qrcode',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      // Gera URL completa para o QR Code (aponta para o frontend)
      const baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:4200';
      const url = `${baseUrl}/table/${tableId}/join`;

      // Gera QR Code em base64
      const qrCodeImage = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      res.json({
        success: true,
        qrCode: qrCodeImage,
        url,
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar QR Code',
      });
    }
  }
);

/**
 * GET /api/tables/:tableId/orders
 * Lista pedidos de uma mesa (Admin)
 */
router.get(
  '/:tableId/orders',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      const table = await Table.findById(tableId);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      // Busca pedidos da mesa
      const orders = await Order.find({
        _id: { $in: table.currentOrders },
      }).populate('clientId', 'name email');

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar pedidos',
      });
    }
  }
);

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
