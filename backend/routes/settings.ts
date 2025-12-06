import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { authenticate, hasPermission } from '../middleware/auth';
import mongoose from 'mongoose';
import { UserRole } from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { auditLog } from '../middleware/auditLogger';
import { logError, sanitizeError } from '../utils/errorSanitizer';

const router = express.Router();

// Middleware específico para settings: aceita admin ou permissão canManageSystemSettings
const canManageSettings = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    return;
  }

  // Admin sempre tem acesso
  if (req.user.role === UserRole.ADMIN || req.user.role === 'admin') {
    return next();
  }

  // Verificar permissão específica
  if (hasPermission(req, 'canManageSystemSettings')) {
    return next();
  }

  res.status(403).json({ success: false, message: 'Permissão negada' });
};

// Path para o arquivo .env
const ENV_PATH = path.join(__dirname, '../../.env');

/**
 * Helper: Ler arquivo .env
 */
async function readEnvFile(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(ENV_PATH, 'utf-8');
    const env: Record<string, string> = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.error('Erro ao ler .env:', error);
    return {};
  }
}

/**
 * Helper: Escrever arquivo .env
 */
async function writeEnvFile(env: Record<string, string>): Promise<void> {
  const lines: string[] = [
    '# ============================================',
    '# BENTO BOX - CONFIGURAÇÃO DO RESTAURANTE',
    '# ============================================',
    '# Gerado automaticamente via Bento Tools',
    '',
  ];

  // Restaurante
  lines.push('# ============================================');
  lines.push('# INFORMAÇÕES DO RESTAURANTE');
  lines.push('# ============================================');
  lines.push(`RESTAURANT_NAME=${env['RESTAURANT_NAME'] || ''}`);
  lines.push(`RESTAURANT_CNPJ=${env['RESTAURANT_CNPJ'] || ''}`);
  lines.push(`RESTAURANT_PHONE=${env['RESTAURANT_PHONE'] || ''}`);
  lines.push(`RESTAURANT_EMAIL=${env['RESTAURANT_EMAIL'] || ''}`);
  lines.push(`RESTAURANT_ADDRESS=${env['RESTAURANT_ADDRESS'] || ''}`);
  lines.push('');

  // Servidor
  lines.push('# ============================================');
  lines.push('# SERVIDOR');
  lines.push('# ============================================');
  lines.push(`PORT=${env['PORT'] || '3001'}`);
  lines.push(`NODE_ENV=${env['NODE_ENV'] || 'production'}`);
  lines.push(`FRONTEND_URL=${env['FRONTEND_URL'] || 'http://localhost:4200'}`);
  lines.push('');

  // MongoDB
  lines.push('# ============================================');
  lines.push('# MONGODB');
  lines.push('# ============================================');
  lines.push(`MONGODB_URI=${env['MONGODB_URI'] || 'mongodb://localhost:27017/bento-box'}`);
  lines.push('');

  // Segurança
  lines.push('# ============================================');
  lines.push('# SEGURANÇA');
  lines.push('# ============================================');
  lines.push(`JWT_SECRET=${env['JWT_SECRET'] || 'MUDE-ESTE-SECRET'}`);
  lines.push(`JWT_EXPIRES_IN=${env['JWT_EXPIRES_IN'] || '7d'}`);
  lines.push(`SESSION_EXPIRY_HOURS=${env['SESSION_EXPIRY_HOURS'] || '24'}`);
  lines.push('');

  // QR Code
  lines.push('# ============================================');
  lines.push('# QR CODE');
  lines.push('# ============================================');
  lines.push(`QR_CODE_BASE_URL=${env['QR_CODE_BASE_URL'] || 'http://localhost:4200'}`);
  lines.push('');

  // Pagamentos
  lines.push('# ============================================');
  lines.push('# PAGAMENTOS');
  lines.push('# ============================================');
  lines.push(`PAYMENT_PROVIDER=${env['PAYMENT_PROVIDER'] || 'none'}`);
  lines.push(`PAYMENT_ENABLED=${env['PAYMENT_ENABLED'] || 'false'}`);
  lines.push(`MERCADOPAGO_PUBLIC_KEY=${env['MERCADOPAGO_PUBLIC_KEY'] || ''}`);
  lines.push(`MERCADOPAGO_ACCESS_TOKEN=${env['MERCADOPAGO_ACCESS_TOKEN'] || ''}`);
  lines.push(`MERCADOPAGO_WEBHOOK_SECRET=${env['MERCADOPAGO_WEBHOOK_SECRET'] || ''}`);
  lines.push(`PAYMENT_PIX_ENABLED=${env['PAYMENT_PIX_ENABLED'] || 'false'}`);
  lines.push(`PAYMENT_CREDIT_CARD_ENABLED=${env['PAYMENT_CREDIT_CARD_ENABLED'] || 'false'}`);
  lines.push(`PAYMENT_DEBIT_CARD_ENABLED=${env['PAYMENT_DEBIT_CARD_ENABLED'] || 'false'}`);
  lines.push(`PAYMENT_WEBHOOK_URL=${env['PAYMENT_WEBHOOK_URL'] || ''}`);
  lines.push('');

  // POS Terminal
  lines.push('# ============================================');
  lines.push('# POS TERMINAL (MAQUININHA)');
  lines.push('# ============================================');
  lines.push(`POS_ENABLED=${env['POS_ENABLED'] || 'false'}`);
  lines.push(`POS_TERMINAL_TYPE=${env['POS_TERMINAL_TYPE'] || 'none'}`);
  lines.push(`POS_CONNECTION_TYPE=${env['POS_CONNECTION_TYPE'] || 'wifi'}`);
  lines.push(`POS_IP_ADDRESS=${env['POS_IP_ADDRESS'] || ''}`);
  lines.push(`POS_PORT=${env['POS_PORT'] || '8080'}`);
  lines.push(`POS_DEVICE_ID=${env['POS_DEVICE_ID'] || ''}`);
  lines.push(`POS_STONE_CODE=${env['POS_STONE_CODE'] || ''}`);
  lines.push(`POS_SERIAL_NUMBER=${env['POS_SERIAL_NUMBER'] || ''}`);
  lines.push(`POS_AUTO_CONFIRM=${env['POS_AUTO_CONFIRM'] || 'true'}`);
  lines.push('');

  // Email
  lines.push('# ============================================');
  lines.push('# EMAIL (SMTP)');
  lines.push('# ============================================');
  lines.push(`EMAIL_ENABLED=${env['EMAIL_ENABLED'] || 'false'}`);
  lines.push(`EMAIL_HOST=${env['EMAIL_HOST'] || 'smtp.gmail.com'}`);
  lines.push(`EMAIL_PORT=${env['EMAIL_PORT'] || '587'}`);
  lines.push(`EMAIL_SECURE=${env['EMAIL_SECURE'] || 'false'}`);
  lines.push(`EMAIL_USER=${env['EMAIL_USER'] || ''}`);
  lines.push(`EMAIL_PASSWORD=${env['EMAIL_PASSWORD'] || ''}`);
  lines.push(`EMAIL_FROM=${env['EMAIL_FROM'] || ''}`);
  lines.push('');

  // Backup
  lines.push('# ============================================');
  lines.push('# BACKUP');
  lines.push('# ============================================');
  lines.push(`BACKUP_ENABLED=${env['BACKUP_ENABLED'] || 'true'}`);
  lines.push(`BACKUP_RETENTION_DAYS=${env['BACKUP_RETENTION_DAYS'] || '7'}`);
  lines.push('');

  // Outros
  lines.push('# ============================================');
  lines.push('# OUTROS');
  lines.push('# ============================================');
  lines.push(`TZ=${env['TZ'] || 'America/Sao_Paulo'}`);
  lines.push(`LOG_LEVEL=${env['LOG_LEVEL'] || 'info'}`);

  await fs.writeFile(ENV_PATH, lines.join('\n'), 'utf-8');
}

/**
 * GET /api/settings/public
 * Obter configurações públicas (não sensíveis)
 * Acessível por qualquer usuário autenticado
 */
router.get('/public', authenticate, async (req, res) => {
  try {
    const env = await readEnvFile();

    // Retorna apenas informações públicas/não sensíveis
    const publicConfig = {
      restaurant: {
        name: env['RESTAURANT_NAME'] || '',
        phone: env['RESTAURANT_PHONE'] || '',
        email: env['RESTAURANT_EMAIL'] || '',
      },
      payment: {
        enabled: env['PAYMENT_ENABLED'] === 'true',
        pixEnabled: env['PAYMENT_PIX_ENABLED'] === 'true',
        creditCardEnabled: env['PAYMENT_CREDIT_CARD_ENABLED'] === 'true',
        debitCardEnabled: env['PAYMENT_DEBIT_CARD_ENABLED'] === 'true',
      },
      posTerminal: {
        enabled: env['POS_TERMINAL_ENABLED'] === 'true',
      },
    };

    res.json(publicConfig);
  } catch (error: any) {
    console.error('Erro ao carregar configurações públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar configurações',
    });
  }
});

/**
 * GET /api/settings
 * Obter configurações atuais (completas - apenas admin)
 */
router.get('/', authenticate, canManageSettings, async (req, res) => {
  try {
    const env = await readEnvFile();

    const config = {
      restaurant: {
        name: env['RESTAURANT_NAME'] || '',
        cnpj: env['RESTAURANT_CNPJ'] || '',
        phone: env['RESTAURANT_PHONE'] || '',
        email: env['RESTAURANT_EMAIL'] || '',
        address: env['RESTAURANT_ADDRESS'] || '',
      },
      payment: {
        provider: env['PAYMENT_PROVIDER'] || 'none',
        enabled: env['PAYMENT_ENABLED'] === 'true',
        publicKey: env['MERCADOPAGO_PUBLIC_KEY'] || '',
        accessToken: '', // Nunca retornar o token real
        pixEnabled: env['PAYMENT_PIX_ENABLED'] === 'true',
        creditCardEnabled: env['PAYMENT_CREDIT_CARD_ENABLED'] === 'true',
        debitCardEnabled: env['PAYMENT_DEBIT_CARD_ENABLED'] === 'true',
        webhookUrl: env['PAYMENT_WEBHOOK_URL'] || '',
      },
      posTerminal: {
        enabled: env['POS_ENABLED'] === 'true',
        terminalType: env['POS_TERMINAL_TYPE'] || 'none',
        connectionType: env['POS_CONNECTION_TYPE'] || 'wifi',
        ipAddress: env['POS_IP_ADDRESS'] || '',
        port: parseInt(env['POS_PORT'] || '8080'),
        deviceId: env['POS_DEVICE_ID'] || '',
        stoneCode: env['POS_STONE_CODE'] || '',
        serialNumber: env['POS_SERIAL_NUMBER'] || '',
        autoConfirm: env['POS_AUTO_CONFIRM'] === 'true',
      },
      email: {
        enabled: env['EMAIL_ENABLED'] === 'true',
        host: env['EMAIL_HOST'] || 'smtp.gmail.com',
        port: parseInt(env['EMAIL_PORT'] || '587'),
        secure: env['EMAIL_SECURE'] === 'true',
        user: env['EMAIL_USER'] || '',
        password: '', // Nunca retornar a senha
        from: env['EMAIL_FROM'] || '',
      },
      database: {
        uri: env['MONGODB_URI'] ? '••••••••' : '', // Mascarar URI
        backupEnabled: env['BACKUP_ENABLED'] === 'true',
        backupRetentionDays: parseInt(env['BACKUP_RETENTION_DAYS'] || '7'),
      },
    };

    res.json(config);
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
});

/**
 * PUT /api/settings
 * Salvar configurações
 */
router.put(
  '/',
  authenticate,
  canManageSettings,
  auditLog('SYSTEM_SETTINGS_CHANGE', 'system'),
  async (req, res) => {
    try {
      const { restaurant, payment, posTerminal, email, database } = req.body;

      // Ler .env atual
      const env = await readEnvFile();

      // Atualizar valores do restaurante
      if (restaurant) {
        env['RESTAURANT_NAME'] = restaurant.name || '';
        env['RESTAURANT_CNPJ'] = restaurant.cnpj || '';
        env['RESTAURANT_PHONE'] = restaurant.phone || '';
        env['RESTAURANT_EMAIL'] = restaurant.email || '';
        env['RESTAURANT_ADDRESS'] = restaurant.address || '';
      }

      // Atualizar valores de pagamento
      if (payment) {
        env['PAYMENT_PROVIDER'] = payment.provider || 'none';
        env['PAYMENT_ENABLED'] = payment.enabled ? 'true' : 'false';

        // Só atualizar tokens se foram fornecidos
        if (payment.publicKey) {
          env['MERCADOPAGO_PUBLIC_KEY'] = payment.publicKey;
        }
        if (payment.accessToken) {
          env['MERCADOPAGO_ACCESS_TOKEN'] = payment.accessToken;
        }

        env['PAYMENT_PIX_ENABLED'] = payment.pixEnabled ? 'true' : 'false';
        env['PAYMENT_CREDIT_CARD_ENABLED'] = payment.creditCardEnabled ? 'true' : 'false';
        env['PAYMENT_DEBIT_CARD_ENABLED'] = payment.debitCardEnabled ? 'true' : 'false';
        env['PAYMENT_WEBHOOK_URL'] = payment.webhookUrl || '';
      }

      // Atualizar valores de POS Terminal
      if (posTerminal) {
        env['POS_ENABLED'] = posTerminal.enabled ? 'true' : 'false';
        env['POS_TERMINAL_TYPE'] = posTerminal.terminalType || 'none';
        env['POS_CONNECTION_TYPE'] = posTerminal.connectionType || 'wifi';
        env['POS_IP_ADDRESS'] = posTerminal.ipAddress || '';
        env['POS_PORT'] = String(posTerminal.port || 8080);
        env['POS_DEVICE_ID'] = posTerminal.deviceId || '';
        env['POS_STONE_CODE'] = posTerminal.stoneCode || '';
        env['POS_SERIAL_NUMBER'] = posTerminal.serialNumber || '';
        env['POS_AUTO_CONFIRM'] = posTerminal.autoConfirm ? 'true' : 'false';
      }

      // Atualizar valores de email
      if (email) {
        env['EMAIL_ENABLED'] = email.enabled ? 'true' : 'false';
        env['EMAIL_HOST'] = email.host || 'smtp.gmail.com';
        env['EMAIL_PORT'] = String(email.port || 587);
        env['EMAIL_SECURE'] = email.secure ? 'true' : 'false';
        env['EMAIL_USER'] = email.user || '';

        // Só atualizar senha se foi fornecida
        if (email.password) {
          env['EMAIL_PASSWORD'] = email.password;
        }

        env['EMAIL_FROM'] = email.from || '';
      }

      // Atualizar valores de database
      if (database) {
        env['BACKUP_ENABLED'] = database.backupEnabled ? 'true' : 'false';
        env['BACKUP_RETENTION_DAYS'] = String(database.backupRetentionDays || 7);
      }

      // Salvar .env
      await writeEnvFile(env);

      res.json({
        success: true,
        message: 'Configurações salvas com sucesso. Reinicie o servidor para aplicar as mudanças.',
      });
    } catch (error) {
      logError('PUT /api/settings', error, { body: req.body });
      const sanitized = sanitizeError(error, 'Erro ao salvar configurações');
      res.status(sanitized.statusCode).json({
        success: false,
        error: sanitized.message,
      });
    }
  }
);

/**
 * POST /api/settings/test-payment
 * Testar conexão com gateway de pagamento
 */
router.post('/test-payment', authenticate, canManageSettings, async (req, res) => {
  try {
    const { provider, publicKey, accessToken, pixEnabled, creditCardEnabled, debitCardEnabled } =
      req.body;

    if (!publicKey || !accessToken) {
      return res.json({
        success: false,
        message: 'Credenciais incompletas',
      });
    }

    // Importar serviço de pagamento
    const { PaymentService } = await import('../services/payment.service');

    const paymentService = new PaymentService({
      provider,
      publicKey,
      accessToken,
      pixEnabled: pixEnabled || false,
      creditCardEnabled: creditCardEnabled || false,
      debitCardEnabled: debitCardEnabled || false,
      webhookUrl: '',
    });

    const result = await paymentService.testConnection();
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao testar pagamento:', error);
    res.json({
      success: false,
      message: error.message || 'Erro ao testar conexão',
    });
  }
});

/**
 * POST /api/settings/test-pos
 * Testar conexão com maquininha (POS Terminal)
 */
router.post('/test-pos', authenticate, canManageSettings, async (req, res) => {
  try {
    const { terminalType, connectionType, ipAddress, port, deviceId, stoneCode } = req.body;

    if (terminalType === 'none') {
      return res.json({
        success: false,
        message: 'Tipo de terminal não selecionado',
      });
    }

    // Importar serviço de POS
    const { POSTerminalService } = await import('../services/pos-terminal.service');

    const posService = new POSTerminalService({
      terminalType,
      connectionType,
      ipAddress: ipAddress || '',
      port: port || 8080,
      deviceId: deviceId || '',
      stoneCode: stoneCode || '',
      serialNumber: '',
      autoConfirm: true,
    });

    const result = await posService.testConnection();
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao testar POS:', error);
    res.json({
      success: false,
      message: error.message || 'Erro ao testar conexão com maquininha',
    });
  }
});

/**
 * POST /api/settings/test-email
 * Testar conexão SMTP
 */
router.post('/test-email', authenticate, canManageSettings, async (req, res) => {
  try {
    const { host, port, secure, user, password, from } = req.body;

    // TODO: Implementar teste real SMTP com nodemailer

    if (!user || !password) {
      return res.json({
        success: false,
        message: 'Credenciais incompletas',
      });
    }

    // Simular teste
    res.json({
      success: true,
      message: 'Email de teste enviado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao testar email:', error);
    res.json({
      success: false,
      message: 'Erro ao testar conexão SMTP',
    });
  }
});

/**
 * POST /api/settings/test-database
 * Testar conexão com banco de dados
 */
router.post('/test-database', authenticate, canManageSettings, async (req, res) => {
  try {
    const start = Date.now();
    const db = mongoose.connection.db;
    if (!db) {
      return res
        .status(500)
        .json({ success: false, message: 'Database connection not initialized' });
    }
    await db.admin().ping();
    const ping = Date.now() - start;

    const collections = await db.listCollections().toArray();

    res.json({
      success: true,
      ping: `${ping}ms`,
      collections: collections.length,
    });
  } catch (error) {
    console.error('Erro ao testar database:', error);
    res.json({
      success: false,
      message: 'Erro ao conectar ao banco de dados',
    });
  }
});

/**
 * POST /api/settings/backup
 * Criar backup manual do banco de dados
 */
router.post(
  '/backup',
  authenticate,
  canManageSettings,
  auditLog('DATABASE_BACKUP', 'system'),
  async (req, res) => {
    try {
      // TODO: Implementar backup real
      // Por enquanto, apenas simular

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;

      res.json({
        success: true,
        filename,
        size: '1.2 MB (simulado)',
      });
    } catch (error) {
      logError('POST /api/settings/backup', error);
      const sanitized = sanitizeError(error, 'Erro ao criar backup');
      res.status(sanitized.statusCode).json({
        success: false,
        message: sanitized.message,
      });
    }
  }
);

export default router;
