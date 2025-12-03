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

/**
 * POST /api/bills/:id/initiate-payment
 * Inicia um pagamento online via gateway
 */
router.post(
  '/:id/initiate-payment',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { method, cardToken, email } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID da bill inválido',
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

      if (bill.status !== BillStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: 'Esta bill não pode receber pagamento',
        });
        return;
      }

      // Importar PaymentService
      const { PaymentService, createPaymentService } = await import('../services/payment.service');
      const paymentService = createPaymentService();

      if (!paymentService) {
        res.status(500).json({
          success: false,
          message: 'Serviço de pagamento não configurado',
        });
        return;
      }

      let paymentResult;
      let paymentMethodEnum: PaymentMethod;

      // Processar pagamento de acordo com o método
      if (method === 'pix') {
        paymentMethodEnum = PaymentMethod.ONLINE_PIX;
        paymentResult = await paymentService.createPixPayment(
          bill.finalTotal,
          `Pagamento Mesa ${bill.tableNumber} - Bill #${bill._id}`,
          email || 'cliente@bentobox.com'
        );
      } else if (method === 'credit' || method === 'debit') {
        paymentMethodEnum =
          method === 'credit' ? PaymentMethod.ONLINE_CREDIT : PaymentMethod.ONLINE_DEBIT;

        if (!cardToken) {
          res.status(400).json({
            success: false,
            message: 'Token do cartão é obrigatório',
          });
          return;
        }

        paymentResult = await paymentService.createCardPayment(
          bill.finalTotal,
          `Pagamento Mesa ${bill.tableNumber} - Bill #${bill._id}`,
          cardToken,
          email || 'cliente@bentobox.com'
        );
      } else {
        res.status(400).json({
          success: false,
          message: 'Método de pagamento inválido',
        });
        return;
      }

      if (!paymentResult.success) {
        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Erro ao processar pagamento',
        });
        return;
      }

      // Atualizar bill com dados do pagamento
      bill.paymentMethod = paymentMethodEnum;
      bill.status = BillStatus.PENDING_PAYMENT;
      bill.paymentData = {
        provider: paymentResult.provider,
        transactionId: paymentResult.transactionId,
        paymentId: paymentResult.paymentId,
        qrCode: paymentResult.qrCode,
        qrCodeText: paymentResult.qrCodeText,
        paymentUrl: paymentResult.paymentUrl,
        expiresAt: paymentResult.expiresAt,
        webhookReceived: false,
      };

      await bill.save();

      res.json({
        success: true,
        data: bill,
        message: 'Pagamento iniciado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao iniciar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar pagamento',
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/bills/:id/payment-status
 * Verifica o status de um pagamento online
 */
router.get(
  '/:id/payment-status',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID da bill inválido',
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

      // Se já foi pago, retornar sucesso
      if (bill.status === BillStatus.PAID) {
        res.json({
          success: true,
          data: bill,
          message: 'Pagamento confirmado',
        });
        return;
      }

      // Se não tem dados de pagamento, retornar erro
      if (!bill.paymentData?.paymentId) {
        res.status(400).json({
          success: false,
          message: 'Nenhum pagamento iniciado para esta bill',
        });
        return;
      }

      // TODO: Aqui você pode consultar o gateway para verificar o status
      // Por enquanto, apenas retornar o status atual da bill

      res.json({
        success: true,
        data: bill,
        message: 'Status do pagamento',
      });
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar status do pagamento',
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/bills/:id/send-to-pos
 * Envia pagamento para maquininha (POS Terminal)
 */
router.post(
  '/:id/send-to-pos',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { paymentType } = req.body; // 'credit', 'debit', 'pix'

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID da bill inválido',
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

      if (bill.status !== BillStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: 'Esta bill não pode receber pagamento',
        });
        return;
      }

      // Importar serviço de POS
      const { createPOSTerminalService } = await import('../services/pos-terminal.service');
      const posService = createPOSTerminalService();

      if (!posService) {
        res.status(500).json({
          success: false,
          message: 'Maquininha não configurada. Configure no painel de admin.',
        });
        return;
      }

      // Enviar pagamento para maquininha
      const paymentRequest = {
        amount: Math.round(bill.finalTotal * 100), // Converter para centavos
        description: `Mesa ${bill.tableNumber} - Bill #${bill._id.toString().substring(0, 8)}`,
        billId: bill._id.toString(),
        paymentType: paymentType || 'credit',
      };

      const result = await posService.sendPayment(paymentRequest);

      if (result.success && result.approved) {
        // Pagamento aprovado - atualizar bill
        bill.status = BillStatus.PAID;
        bill.paidAt = new Date();
        bill.paymentData = {
          provider: 'pos_terminal',
          transactionId: result.transactionId,
          webhookReceived: true,
        };

        await bill.save();

        res.json({
          success: true,
          data: bill,
          message: result.message || 'Pagamento aprovado na maquininha!',
          receiptText: result.receiptText,
        });
      } else {
        // Pagamento recusado ou erro
        res.status(400).json({
          success: false,
          message: result.message || 'Pagamento recusado pela maquininha',
          error: result.error,
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar pagamento para POS:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar pagamento na maquininha',
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/bills/:id/pos-status
 * Verifica status de pagamento na maquininha
 */
router.get('/:id/pos-status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID da bill inválido',
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

    // Se já foi pago, retornar sucesso
    if (bill.status === BillStatus.PAID) {
      res.json({
        success: true,
        data: bill,
        message: 'Pagamento confirmado',
        approved: true,
      });
      return;
    }

    // Se não tem transactionId, ainda não foi enviado
    if (!bill.paymentData?.transactionId) {
      res.json({
        success: true,
        data: bill,
        message: 'Aguardando envio para maquininha',
        approved: false,
      });
      return;
    }

    // Consultar status na maquininha
    const { createPOSTerminalService } = await import('../services/pos-terminal.service');
    const posService = createPOSTerminalService();

    if (posService) {
      const result = await posService.checkPaymentStatus(bill.paymentData.transactionId);

      // Recarregar bill do banco para ter tipo completo
      const currentBill = await Bill.findById(bill._id);
      if (result.approved && currentBill && currentBill.status !== BillStatus.PAID) {
        // Atualizar para pago se confirmado
        currentBill.status = BillStatus.PAID;
        currentBill.paidAt = new Date();
        await currentBill.save();
      }

      res.json({
        success: true,
        data: currentBill || bill,
        message: result.message,
        approved: result.approved,
      });
    } else {
      // Recarregar bill do banco para ter tipo completo
      const currentBill = await Bill.findById(bill._id);
      res.json({
        success: true,
        data: currentBill || bill,
        message: 'Status atual da bill',
        approved: currentBill ? currentBill.status === BillStatus.PAID : false,
      });
    }
  } catch (error: any) {
    console.error('Erro ao verificar status POS:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status na maquininha',
      error: error.message,
    });
  }
});

export default router;
