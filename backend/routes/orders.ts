import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { Order, OrderStatus, IOrderItem } from '../models/Order';
import { Table, TableStatus } from '../models/Table';
import { User } from '../models/User';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, runValidations } from '../middleware/validate';

const router = Router();

/**
 * POST /api/orders
 * Cria um novo pedido (Cliente autenticado ou anônimo)
 */
router.post(
  '/',
  optionalAuth,
  runValidations([
    body('tableId').isMongoId().withMessage('ID da mesa inválido'),
    body('items').isArray({ min: 1 }).withMessage('Pedido deve ter pelo menos 1 item'),
    body('items.*.productId').isInt().withMessage('ID do produto inválido'),
    body('items.*.productName').notEmpty().withMessage('Nome do produto é obrigatório'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que 0'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Preço unitário inválido'),
    body('items.*.totalPrice').isFloat({ min: 0 }).withMessage('Preço total inválido'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId, items, notes, sessionToken } = req.body;

      // Verifica se mesa existe
      const table = await Table.findById(tableId);
      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Mesa não encontrada',
        });
        return;
      }

      // Verifica se mesa está fechada
      if (table.status === TableStatus.CLOSED) {
        res.status(400).json({
          success: false,
          message: 'Mesa fechada para novos pedidos',
        });
        return;
      }

      let clientId = req.user?.userId;
      let clientName = 'Cliente';
      let orderSessionToken = sessionToken;

      // Se tem usuário autenticado
      if (req.user && !req.user.isAnonymous) {
        const user = await User.findById(req.user.userId);
        if (user) {
          clientName = user.name;
          orderSessionToken = undefined; // Usuário autenticado não precisa de sessionToken
        }
      } else if (sessionToken) {
        // Cliente anônimo com sessionToken
        const anonymousUser = await User.findOne({
          sessionToken,
          isAnonymous: true,
          sessionExpiry: { $gt: new Date() },
        });

        if (anonymousUser) {
          clientName = anonymousUser.name || `Cliente Anônimo`;
          clientId = undefined; // Sessão anônima não tem clientId
        } else {
          res.status(401).json({
            success: false,
            message: 'Sessão inválida ou expirada',
          });
          return;
        }
      } else {
        res.status(401).json({
          success: false,
          message: 'Autenticação necessária ou sessão anônima inválida',
        });
        return;
      }

      // Valida e calcula total dos itens
      const orderItems: IOrderItem[] = items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      }));

      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // Cria pedido
      const order = new Order({
        tableId,
        clientId,
        sessionToken: orderSessionToken,
        clientName,
        items: orderItems,
        totalAmount,
        status: OrderStatus.PENDING,
        notes,
      });

      await order.save();

      // Atualiza status da mesa se estava disponível
      if (table.status === TableStatus.AVAILABLE) {
        table.status = TableStatus.OCCUPIED;
      }

      // Adiciona pedido à lista de pedidos atuais da mesa
      table.currentOrders.push(order._id as any);
      await table.save();

      res.status(201).json({
        success: true,
        message: 'Pedido criado com sucesso',
        order: {
          ...order.toObject(),
          id: (order._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar pedido',
      });
    }
  }
);

/**
 * GET /api/orders/my-orders
 * Lista pedidos do usuário/sessão atual
 */
router.get('/my-orders', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionToken = req.query['sessionToken'] as string;
    let query: any = {};

    if (req.user && !req.user.isAnonymous) {
      // Usuário autenticado
      query.clientId = req.user.userId;
    } else if (sessionToken) {
      // Sessão anônima
      query.sessionToken = sessionToken;
    } else {
      res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
      });
      return;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('tableId', 'number');

    const ordersFormatted = orders.map(order => ({
      ...order.toObject(),
      id: (order._id as any).toString(),
    }));

    res.json({
      success: true,
      orders: ordersFormatted,
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar pedidos',
    });
  }
});

/**
 * GET /api/orders/table/:tableId
 * Lista pedidos de uma mesa específica (Admin)
 */
router.get(
  '/table/:tableId',
  authenticate,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      const orders = await Order.find({ tableId })
        .sort({ createdAt: -1 })
        .populate('clientId', 'name email');

      const ordersFormatted = orders.map(order => ({
        ...order.toObject(),
        id: (order._id as any).toString(),
      }));

      res.json({
        success: true,
        orders: ordersFormatted,
      });
    } catch (error) {
      console.error('Erro ao listar pedidos da mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar pedidos',
      });
    }
  }
);

/**
 * GET /api/orders/:orderId
 * Busca um pedido específico
 */
router.get(
  '/:orderId',
  optionalAuth,
  runValidations([param('orderId').isMongoId().withMessage('ID do pedido inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const sessionToken = req.query['sessionToken'] as string;

      const order = await Order.findById(orderId).populate('tableId', 'number');

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido não encontrado',
        });
        return;
      }

      // Verifica permissão: admin, dono do pedido (autenticado) ou sessão anônima
      const isAdmin = req.user?.role === 'admin';
      const isOwner = req.user && order.clientId && order.clientId.toString() === req.user.userId;
      const isAnonymousOwner = sessionToken && order.sessionToken === sessionToken;

      if (!isAdmin && !isOwner && !isAnonymousOwner) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
        return;
      }

      res.json({
        success: true,
        order: {
          ...order.toObject(),
          id: (order._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar pedido',
      });
    }
  }
);

/**
 * PUT /api/orders/:orderId/status
 * Atualiza status de um pedido (Admin)
 */
router.put(
  '/:orderId/status',
  authenticate,
  runValidations([
    param('orderId').isMongoId().withMessage('ID do pedido inválido'),
    body('status').isIn(Object.values(OrderStatus)).withMessage('Status inválido'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido não encontrado',
        });
        return;
      }

      // Atualiza status
      order.status = status;

      // Define timestamps especiais
      if (status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      } else if (status === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
      }

      await order.save();

      res.json({
        success: true,
        message: `Pedido marcado como ${status}`,
        order: {
          ...order.toObject(),
          id: (order._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar pedido',
      });
    }
  }
);

/**
 * DELETE /api/orders/:orderId
 * Cancela um pedido (Cliente pode cancelar se PENDING, Admin pode sempre)
 */
router.delete(
  '/:orderId',
  optionalAuth,
  runValidations([param('orderId').isMongoId().withMessage('ID do pedido inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const sessionToken = req.query['sessionToken'] as string;

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido não encontrado',
        });
        return;
      }

      // Verifica permissão
      const isAdmin = req.user?.role === 'admin';
      const isOwner = req.user && order.clientId && order.clientId.toString() === req.user.userId;
      const isAnonymousOwner = sessionToken && order.sessionToken === sessionToken;

      if (!isAdmin && !isOwner && !isAnonymousOwner) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
        return;
      }

      // Clientes só podem cancelar pedidos PENDING
      if (!isAdmin && order.status !== OrderStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: 'Pedido já em preparo, não pode ser cancelado',
        });
        return;
      }

      // Cancela pedido
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      await order.save();

      // Remove da lista de pedidos atuais da mesa
      await Table.updateOne({ _id: order.tableId }, { $pull: { currentOrders: order._id } });

      res.json({
        success: true,
        message: 'Pedido cancelado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar pedido',
      });
    }
  }
);

/**
 * GET /api/orders
 * Lista todos os pedidos (Admin - com filtros opcionais)
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tableId } = req.query;
    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (tableId) {
      query.tableId = tableId;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('tableId', 'number')
      .populate('clientId', 'name email');

    const ordersFormatted = orders.map(order => ({
      ...order.toObject(),
      id: (order._id as any).toString(),
    }));

    res.json({
      success: true,
      orders: ordersFormatted,
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar pedidos',
    });
  }
});

export default router;
