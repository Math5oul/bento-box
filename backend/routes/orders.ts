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
          clientId = String(anonymousUser._id); // Salva o ID do usuário anônimo
          orderSessionToken = sessionToken; // Mantém sessionToken para facilitar transferência
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

      // Se usuário autenticado, adiciona o pedido ao orderHistory
      if (clientId) {
        await User.updateOne({ _id: clientId }, { $push: { orderHistory: order._id } });
      }

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

    if (req.user && !req.user.isAnonymous) {
      // Usuário autenticado: busca pelo orderHistory
      const user = await User.findById(req.user.userId).select('orderHistory');
      if (!user) {
        res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        return;
      }
      const orders = await Order.find({ _id: { $in: user.orderHistory } })
        .sort({ createdAt: -1 })
        .populate('tableId', 'number');
      const ordersFormatted = orders.map(order => ({
        ...order.toObject(),
        id: (order._id as any).toString(),
      }));
      res.json({ success: true, orders: ordersFormatted });
      return;
    } else if (sessionToken) {
      // Sessão anônima
      const orders = await Order.find({ sessionToken })
        .sort({ createdAt: -1 })
        .populate('tableId', 'number');
      const ordersFormatted = orders.map(order => ({
        ...order.toObject(),
        id: (order._id as any).toString(),
      }));
      res.json({ success: true, orders: ordersFormatted });
      return;
    } else {
      res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
      });
      return;
    }
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
 * GET /api/orders/current-table/:tableId
 * Lista pedidos da mesa atual do cliente (autenticado ou anônimo)
 */
router.get(
  '/current-table/:tableId',
  optionalAuth,
  runValidations([param('tableId').isMongoId().withMessage('ID da mesa inválido')]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;
      const sessionToken = req.query['sessionToken'] as string;

      let query: any = { tableId };

      // Se usuário autenticado
      if (req.user && !req.user.isAnonymous) {
        query.clientId = req.user.userId;
      } else if (sessionToken) {
        // Cliente anônimo
        query.sessionToken = sessionToken;
      } else {
        res.status(401).json({
          success: false,
          message: 'Autenticação necessária ou sessão anônima inválida',
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
      console.error('Erro ao buscar pedidos da mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar pedidos',
      });
    }
  }
);

/**
 * PATCH /api/orders/transfer-anonymous
 * Transfere pedidos anônimos para usuário autenticado
 */
router.patch(
  '/transfer-anonymous',
  authenticate,
  runValidations([
    body('tableId').isMongoId().withMessage('ID da mesa inválido'),
    body('sessionToken').notEmpty().withMessage('Token de sessão é obrigatório'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId, sessionToken } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
        return;
      }

      // Busca o usuário para pegar o nome
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
        return;
      }

      let totalTransferred = 0;

      // CENÁRIO 1: Busca pedidos com sessionToken direto
      const ordersBySessionToken = await Order.find({
        tableId,
        sessionToken,
      });

      if (ordersBySessionToken.length > 0) {
        const result1 = await Order.updateMany(
          { tableId, sessionToken },
          {
            $set: {
              clientId: userId,
              clientName: user.name,
            },
            $unset: { sessionToken: '' },
          }
        );
        totalTransferred += result1.modifiedCount;
      }

      // CENÁRIO 2: Busca pedidos via usuário anônimo
      const anonymousUser = await User.findOne({
        sessionToken,
        isAnonymous: true,
      });

      if (anonymousUser) {
        const ordersByClientId = await Order.find({
          tableId,
          clientId: anonymousUser._id,
        });

        if (ordersByClientId.length > 0) {
          const result2 = await Order.updateMany(
            { tableId, clientId: anonymousUser._id },
            {
              $set: {
                clientId: userId,
                clientName: user.name,
              },
            }
          );
          totalTransferred += result2.modifiedCount;
        }
      }

      if (totalTransferred === 0) {
        res.json({
          success: true,
          message: 'Nenhum pedido para transferir',
          count: 0,
        });
        return;
      }

      // Adiciona os pedidos transferidos ao orderHistory do usuário
      const allUserOrders = await Order.find({
        tableId,
        clientId: userId,
      }).select('_id');

      if (allUserOrders.length > 0) {
        await User.updateOne(
          { _id: userId },
          { $addToSet: { orderHistory: { $each: allUserOrders.map(o => o._id) } } }
        );
      }

      console.log(`✅ ${totalTransferred} pedido(s) transferido(s) para ${user.name}`);

      res.json({
        success: true,
        message: `${totalTransferred} pedidos transferidos com sucesso`,
        count: totalTransferred,
      });
    } catch (error) {
      console.error('❌ Erro ao transferir pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao transferir pedidos',
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
 * Atualiza status de um pedido (Admin, Kitchen, ou Waiter)
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

      // Verifica permissão: admin, cozinha ou garçom
      const role = req.user?.role;
      if (role !== 'admin' && role !== 'cozinha' && role !== 'garcom') {
        res.status(403).json({ success: false, message: 'Permissão negada' });
        return;
      }

      // Regras simples de transição (opcional: poderia validar sequência)
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
 * PATCH /api/orders/:orderId/status
 * Atualiza status de um pedido (versão PATCH para compatibilidade)
 */
router.patch(
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

      // Verifica permissão: admin, cozinha ou garçom
      const role = req.user?.role;
      if (role !== 'admin' && role !== 'cozinha' && role !== 'garcom') {
        res.status(403).json({ success: false, message: 'Permissão negada' });
        return;
      }

      order.status = status;

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
 * PATCH /api/orders/:orderId
 * Atualiza itens de um pedido (Admin ou Garçom)
 */
router.patch(
  '/:orderId',
  authenticate,
  runValidations([
    param('orderId').isMongoId().withMessage('ID do pedido inválido'),
    body('items').optional().isArray({ min: 1 }).withMessage('Pedido deve ter pelo menos 1 item'),
    body('items.*.productId').optional().isInt().withMessage('ID do produto inválido'),
    body('items.*.productName').optional().notEmpty().withMessage('Nome do produto é obrigatório'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantidade deve ser maior que 0'),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Preço unitário inválido'),
    body('items.*.totalPrice').optional().isFloat({ min: 0 }).withMessage('Preço total inválido'),
    body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total inválido'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { items, totalAmount, notes } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido não encontrado',
        });
        return;
      }

      // Verifica permissão: admin ou garçom
      const role = req.user?.role;
      if (role !== 'admin' && role !== 'garcom') {
        res.status(403).json({
          success: false,
          message: 'Permissão negada. Apenas admin ou garçom podem editar pedidos.',
        });
        return;
      }

      // Não pode editar pedidos já entregues ou cancelados
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        res.status(400).json({
          success: false,
          message: 'Não é possível editar pedidos já entregues ou cancelados',
        });
        return;
      }

      // Atualiza itens se fornecidos
      if (items && Array.isArray(items)) {
        order.items = items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
          selectedSize: item.selectedSize,
        }));
      }

      // Atualiza total se fornecido, senão recalcula
      if (totalAmount !== undefined) {
        order.totalAmount = totalAmount;
      } else if (items) {
        order.totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
      }

      // Atualiza notas se fornecidas
      if (notes !== undefined) {
        order.notes = notes;
      }

      await order.save();

      res.json({
        success: true,
        message: 'Pedido atualizado com sucesso',
        order: {
          ...order.toObject(),
          id: (order._id as any).toString(),
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
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
      // popula isAnonymous para identificar clientes anônimos
      .populate('clientId', 'name email isAnonymous');

    const ordersFormatted = orders.map(order => {
      const obj = order.toObject();
      // Se tableId está populado, pega o número
      let tableNumber = undefined;
      if (obj.tableId && typeof obj.tableId === 'object' && 'number' in obj.tableId) {
        tableNumber = obj.tableId.number;
      }
      // Detecta se o cliente do pedido é anônimo: clientId populado com isAnonymous ou existe sessionToken
      const clientObj: any = obj.clientId;
      const isClientAnonymous =
        (clientObj && typeof clientObj === 'object' && clientObj.isAnonymous === true) ||
        !!obj.sessionToken;
      return {
        ...obj,
        id: (order._id as any).toString(),
        tableNumber,
        isClientAnonymous,
      };
    });

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
 * PATCH /api/orders/:orderId/rename-client
 * Permite que garçom/admin renomeie o cliente associado a um pedido (apenas cliente anônimo)
 */
router.patch(
  '/:orderId/rename-client',
  authenticate,
  runValidations([
    param('orderId').isMongoId().withMessage('ID do pedido inválido'),
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  ]),
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { name } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, message: 'Pedido não encontrado' });
        return;
      }

      // Permissão: admin ou garçom ou cozinha
      const role = req.user?.role;
      if (role !== 'admin' && role !== 'garcom' && role !== 'cozinha') {
        res.status(403).json({ success: false, message: 'Permissão negada' });
        return;
      }

      const newName = String(name).trim();

      // Só permite renomear se o cliente for anônimo (clientId anônimo ou sessionToken presente)
      const isAnonByClientId =
        !!order.clientId && (await User.exists({ _id: order.clientId, isAnonymous: true }));
      const isAnonBySession =
        !!order.sessionToken &&
        (await User.exists({ sessionToken: order.sessionToken, isAnonymous: true }));

      if (!isAnonByClientId && !isAnonBySession) {
        res
          .status(400)
          .json({ success: false, message: 'Apenas clientes anônimos podem ser renomeados' });
        return;
      }

      const oldName = order.clientName || '';

      // Atualiza User anônimo quando aplicável
      if (isAnonByClientId) {
        const user = await User.findById(order.clientId);
        if (user) {
          user.name = newName;
          await user.save();
        }
      }
      if (isAnonBySession) {
        const anon = await User.findOne({ sessionToken: order.sessionToken, isAnonymous: true });
        if (anon) {
          anon.name = newName;
          await anon.save();
        }
      }

      // Atualiza todos os pedidos que possuam exatamente o mesmo clientName antigo
      await Order.updateMany({ clientName: oldName }, { $set: { clientName: newName } });

      res.json({ success: true, message: 'Nome do cliente atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao renomear cliente do pedido:', error);
      res.status(500).json({ success: false, message: 'Erro ao renomear cliente' });
    }
  }
);

export default router;
