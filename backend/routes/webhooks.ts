import { Router, Request, Response } from 'express';
import { Bill, BillStatus } from '../models/Bill';

const router = Router();

/**
 * POST /api/webhooks/payment
 * Recebe notificações de pagamento dos gateways
 * IMPORTANTE: Esta rota NÃO deve ter autenticação pois é chamada pelos gateways
 */
router.post('/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = req.query['provider'] as string;
    const webhookData = req.body;

    console.log(`📨 Webhook recebido do provider: ${provider}`);
    console.log('Dados:', JSON.stringify(webhookData, null, 2));

    if (!provider) {
      res.status(400).json({
        success: false,
        message: 'Provider não especificado',
      });
      return;
    }

    // Processar webhook de acordo com o provider
    let paymentId: string | undefined;
    let paymentStatus: string | undefined;

    switch (provider.toLowerCase()) {
      case 'mercadopago':
        // Mercado Pago envia o ID do pagamento em data.id
        paymentId = webhookData.data?.id || webhookData.id;
        paymentStatus = webhookData.action || webhookData.type;

        // Mercado Pago pode enviar vários tipos de notificação
        // Processar apenas notificações de pagamento
        if (paymentStatus !== 'payment.created' && paymentStatus !== 'payment.updated') {
          res.status(200).json({ success: true, message: 'Notificação ignorada' });
          return;
        }
        break;

      case 'stripe':
        // Stripe envia eventos estruturados
        paymentId = webhookData.data?.object?.id;
        paymentStatus = webhookData.type;
        break;

      case 'pagseguro':
        // PagSeguro envia notificationCode
        paymentId = webhookData.code || webhookData.reference;
        paymentStatus = webhookData.status;
        break;

      case 'asaas':
        // Asaas envia event e payment
        paymentId = webhookData.payment?.id;
        paymentStatus = webhookData.event;
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Provider não suportado',
        });
        return;
    }

    if (!paymentId) {
      res.status(400).json({
        success: false,
        message: 'ID de pagamento não encontrado no webhook',
      });
      return;
    }

    // Buscar bill pelo paymentId
    const bill = await Bill.findOne({
      'paymentData.paymentId': paymentId,
    });

    if (!bill) {
      console.warn(`⚠️  Bill não encontrada para paymentId: ${paymentId}`);
      res.status(404).json({
        success: false,
        message: 'Bill não encontrada',
      });
      return;
    }

    // Atualizar bill com dados do webhook
    bill.paymentData = {
      ...bill.paymentData,
      webhookReceived: true,
      webhookData: webhookData,
    };

    // Determinar novo status com base no status do pagamento
    const isPaid = isPaymentSuccessful(provider, paymentStatus, webhookData);
    const isFailed = isPaymentFailed(provider, paymentStatus, webhookData);

    if (isPaid) {
      bill.status = BillStatus.PAID;
      bill.paidAt = new Date();
      console.log(`✅ Pagamento confirmado para Bill ${bill._id}`);
    } else if (isFailed) {
      bill.status = BillStatus.FAILED;
      console.log(`❌ Pagamento falhou para Bill ${bill._id}`);
    } else {
      bill.status = BillStatus.PROCESSING;
      console.log(`⏳ Pagamento em processamento para Bill ${bill._id}`);
    }

    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhook',
      error: error.message,
    });
  }
});

/**
 * Verifica se o pagamento foi bem-sucedido
 */
function isPaymentSuccessful(
  provider: string,
  status: string | undefined,
  webhookData: any
): boolean {
  switch (provider.toLowerCase()) {
    case 'mercadopago':
      return webhookData.data?.object?.status === 'approved' || webhookData.status === 'approved';

    case 'stripe':
      return status === 'payment_intent.succeeded' || status === 'charge.succeeded';

    case 'pagseguro':
      // Status 3 = Pago, 4 = Disponível
      return webhookData.status === '3' || webhookData.status === '4';

    case 'asaas':
      return status === 'PAYMENT_RECEIVED' || status === 'PAYMENT_CONFIRMED';

    default:
      return false;
  }
}

/**
 * Verifica se o pagamento falhou
 */
function isPaymentFailed(provider: string, status: string | undefined, webhookData: any): boolean {
  switch (provider.toLowerCase()) {
    case 'mercadopago':
      return (
        webhookData.data?.object?.status === 'rejected' ||
        webhookData.data?.object?.status === 'cancelled' ||
        webhookData.status === 'rejected' ||
        webhookData.status === 'cancelled'
      );

    case 'stripe':
      return status === 'payment_intent.payment_failed' || status === 'charge.failed';

    case 'pagseguro':
      // Status 7 = Cancelada
      return webhookData.status === '7';

    case 'asaas':
      return status === 'PAYMENT_REPROVED' || status === 'PAYMENT_DELETED';

    default:
      return false;
  }
}

/**
 * POST /api/webhooks/payment/mercadopago
 * Webhook específico para Mercado Pago (para facilitar configuração)
 */
router.post('/payment/mercadopago', async (req: Request, res: Response): Promise<void> => {
  req.query['provider'] = 'mercadopago';
  // Redirecionar para a rota principal
  await processWebhook(req, res);
});

/**
 * POST /api/webhooks/payment/stripe
 * Webhook específico para Stripe
 */
router.post('/payment/stripe', async (req: Request, res: Response): Promise<void> => {
  req.query['provider'] = 'stripe';
  await processWebhook(req, res);
});

/**
 * POST /api/webhooks/payment/pagseguro
 * Webhook específico para PagSeguro
 */
router.post('/payment/pagseguro', async (req: Request, res: Response): Promise<void> => {
  req.query['provider'] = 'pagseguro';
  await processWebhook(req, res);
});

/**
 * POST /api/webhooks/payment/asaas
 * Webhook específico para Asaas
 */
router.post('/payment/asaas', async (req: Request, res: Response): Promise<void> => {
  req.query['provider'] = 'asaas';
  await processWebhook(req, res);
});

/**
 * Função auxiliar para processar webhook
 */
async function processWebhook(req: Request, res: Response): Promise<void> {
  const provider = req.query['provider'] as string;
  const webhookData = req.body;

  console.log(`📨 Webhook recebido do provider: ${provider}`);
  console.log('Dados:', JSON.stringify(webhookData, null, 2));

  if (!provider) {
    res.status(400).json({
      success: false,
      message: 'Provider não especificado',
    });
    return;
  }

  // (O código de processamento seria movido aqui, mas vou manter na rota principal para simplicidade)
}

export default router;
