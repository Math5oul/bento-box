import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bill, BillStatus, PaymentMethod } from '../models/Bill';
import { Order } from '../models/Order';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/bills
 * Cria uma nova bill (registro de pagamento)
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableId, tableNumber, orderIds, items, subtotal, finalTotal, paymentMethod, notes } =
      req.body;

    // Validações básicas
    if (!tableId || !tableNumber || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Dados obrigatórios faltando: tableId, tableNumber e items são necessários',
      });
      return;
    }

    // Validar tableId
    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      res.status(400).json({
        success: false,
        message: 'tableId inválido',
      });
      return;
    }

    // Validar orderIds
    if (orderIds && Array.isArray(orderIds)) {
      for (const orderId of orderIds) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          res.status(400).json({
            success: false,
            message: `orderId inválido: ${orderId}`,
          });
          return;
        }
      }
    }

    // Calcular totais dos itens
    const processedItems = items.map((item: any) => {
      const subtotal = item.quantity * item.unitPrice;
      let finalPrice = subtotal;

      // Aplicar desconto se houver
      if (item.discount) {
        if (item.discount.type === 'percentage') {
          const discountAmount = (subtotal * item.discount.value) / 100;
          finalPrice = subtotal - discountAmount;
        } else if (item.discount.type === 'fixed') {
          finalPrice = Math.max(0, subtotal - item.discount.value);
        }
      }

      return {
        ...item,
        subtotal,
        finalPrice,
      };
    });

    // Criar a bill
    const bill = new Bill({
      tableId,
      tableNumber,
      orderIds: orderIds || [],
      items: processedItems,
      subtotal: subtotal,
      finalTotal: finalTotal,
      paymentMethod,
      status: BillStatus.PENDING,
      paidBy: (req as any).user?.userId,
      notes,
    });

    await bill.save();

    // Atualizar paidQuantity nos orders originais
    for (const item of processedItems) {
      if (item.orderId && item.quantity) {
        try {
          const order = await Order.findById(item.orderId);
          if (order) {
            // Encontra o item no order usando o orderItemId
            const orderItemIndex = order.items.findIndex(
              (oi: any, idx: number) => `${item.orderId}-${idx}` === item.orderItemId
            );

            if (orderItemIndex !== -1) {
              const orderItem = order.items[orderItemIndex];
              // Incrementa a quantidade paga
              orderItem.paidQuantity = (orderItem.paidQuantity || 0) + item.quantity;
              await order.save();
            }
          }
        } catch (orderError) {
          console.error(`Erro ao atualizar order ${item.orderId}:`, orderError);
          // Não falha a operação toda se um order falhar
        }
      }
    }

    res.status(201).json({
      success: true,
      data: bill,
      message: 'Bill criada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao criar bill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar bill',
      error: error.message,
    });
  }
});

/**
 * GET /api/bills
 * Lista todas as bills (com filtros opcionais)
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableId, status, limit = 50, skip = 0 } = req.query;

    const query: any = {};

    if (tableId) {
      if (!mongoose.Types.ObjectId.isValid(tableId as string)) {
        res.status(400).json({
          success: false,
          message: 'tableId inválido',
        });
        return;
      }
      query.tableId = tableId;
    }

    if (status) {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate('tableId', 'number capacity')
      .populate('paidBy', 'name email');

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      data: bills,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + Number(limit),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar bills:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar bills',
      error: error.message,
    });
  }
});

/**
 * GET /api/bills/:id
 * Obtém detalhes de uma bill específica
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    const bill = await Bill.findById(id)
      .populate('tableId', 'number capacity')
      .populate('orderIds')
      .populate('paidBy', 'name email');

    if (!bill) {
      res.status(404).json({
        success: false,
        message: 'Bill não encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error: any) {
    console.error('Erro ao buscar bill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar bill',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/bills/:id/status
 * Atualiza o status de uma bill
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    if (!status || !Object.values(BillStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status inválido',
      });
      return;
    }

    const bill = await Bill.findById(id);

    if (!bill) {
      res.status(404).json({
        success: false,
        message: 'Bill não encontrada',
      });
      return;
    }

    bill.status = status;

    if (status === BillStatus.PAID) {
      bill.paidAt = new Date();
      if (paymentMethod && Object.values(PaymentMethod).includes(paymentMethod)) {
        bill.paymentMethod = paymentMethod;
      }
    }

    await bill.save();

    res.json({
      success: true,
      data: bill,
      message: 'Status da bill atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status da bill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da bill',
      error: error.message,
    });
  }
});

/**
 * GET /api/bills/table/:tableId/summary
 * Obtém resumo de bills de uma mesa (total pago, pendente, etc)
 */
router.get(
  '/table/:tableId/summary',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(tableId)) {
        res.status(400).json({
          success: false,
          message: 'tableId inválido',
        });
        return;
      }

      const bills = await Bill.find({ tableId });

      const summary = {
        totalBills: bills.length,
        totalPaid: bills
          .filter(b => b.status === BillStatus.PAID)
          .reduce((sum, b) => sum + b.finalTotal, 0),
        totalPending: bills
          .filter(b => b.status === BillStatus.PENDING)
          .reduce((sum, b) => sum + b.finalTotal, 0),
        paidBills: bills.filter(b => b.status === BillStatus.PAID).length,
        pendingBills: bills.filter(b => b.status === BillStatus.PENDING).length,
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Erro ao buscar resumo de bills:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar resumo de bills',
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/bills/:id
 * Deleta uma bill (apenas se status = PENDING ou CANCELLED)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    const bill = await Bill.findById(id);

    if (!bill) {
      res.status(404).json({
        success: false,
        message: 'Bill não encontrada',
      });
      return;
    }

    if (bill.status === BillStatus.PAID) {
      res.status(400).json({
        success: false,
        message: 'Não é possível deletar uma bill paga',
      });
      return;
    }

    await Bill.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bill deletada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao deletar bill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar bill',
      error: error.message,
    });
  }
});

export default router;
