import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware';

dotenv.config();

import authRoutes from './routes/auth';
import tableRoutes from './routes/table';
import productRoutes from './routes/products';
import uploadRoutes from './routes/upload';
import fillerRoutes from './routes/fillers';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import categoryRoutes from './routes/categories';
import roleRoutes from './routes/roles';
import billRoutes from './routes/bills';
import settingsRoutes from './routes/settings';
import webhookRoutes from './routes/webhooks';

const app: Express = express();
const PORT = process.env['PORT'] || 3001;

app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/assets/images', express.static(path.join(__dirname, '..', 'src', 'assets', 'images')));

app.get('/api/health', (req, res) => {
  const dbInfo = {
    name: mongoose.connection?.name || null,
    host: mongoose.connection?.host || null,
    readyState: mongoose.connection?.readyState ?? null,
  };

  // URI do MongoDB (para copiar no Compass)
  // Retorna a URI completa para facilitar conexão via Compass
  const mongoUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bento-box';

  // Detecta automaticamente a URL do frontend baseado no request
  const referer = req.get('referer') || req.get('origin'); // URL completa de onde veio a requisição

  // PRIORIDADE 1: Se veio de um referer (navegador), extrai o origin dele
  let frontendUrl: string | undefined = undefined;
  if (referer) {
    try {
      const url = new URL(referer);
      frontendUrl = `${url.protocol}//${url.host}`;
    } catch (err) {
      console.warn('⚠️ Erro ao parsear referer:', referer, err);
    }
  }

  // PRIORIDADE 2: Variável de ambiente (para produção)
  if (!frontendUrl && process.env['FRONTEND_URL']) {
    frontendUrl = process.env['FRONTEND_URL'];
    console.log('✅ Frontend URL da env:', frontendUrl);
  }

  // PRIORIDADE 3 (Fallback): Tenta inferir do host do backend
  if (!frontendUrl) {
    const protocol = req.protocol; // 'http' ou 'https'
    const host = req.get('host'); // ex: 'localhost:3001' ou '192.168.1.159:3001'

    if (host) {
      // Se backend está em 3001, frontend provavelmente está em 4200
      const frontendHost = host.replace(':3001', ':4200');
      frontendUrl = `${protocol}://${frontendHost}`;
      console.log('⚠️ Frontend URL inferida do host (fallback):', frontendUrl);
    }
  }

  res.json({
    success: true,
    message: 'Backend Bento Box OK',
    timestamp: new Date().toISOString(),
    db: dbInfo,
    mongoUri: mongoUri, // URI completa para Compass
    frontendUrl: frontendUrl,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/tables', tableRoutes); // Alias para compatibilidade
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/fillers', fillerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(notFound);
app.use(errorHandler);

/**
 * Inicializa conexão com MongoDB e inicia o servidor Express
 */
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('🚀 Servidor iniciado!');
      console.log(`📡 Rodando na porta: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`✅ Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
