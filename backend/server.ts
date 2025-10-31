// ...existing code...
import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware';
import helmet from 'helmet';

import csurf from 'csurf';
import { skipCsrf } from './middleware/csrf';

dotenv.config();

import authRoutes from './routes/auth';
import tableRoutes from './routes/table';
import uploadRoutes from './routes/upload';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import fillerRoutes from './routes/fillers';

const app: Express = express();
const PORT = process.env['PORT'] || 3001;

const csrfProtection = csurf({ cookie: false });

// Rota para fornecer o token CSRF ao frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ...existing code...

app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/assets/images', express.static(path.join(__dirname, '..', 'src', 'assets', 'images')));

// ...existing code...

app.get('/api/health', (req, res) => {
  const dbInfo = {
    name: mongoose.connection?.name || null,
    host: mongoose.connection?.host || null,
    readyState: mongoose.connection?.readyState ?? null,
  };

  res.json({
    success: true,
    message: 'Backend Bento Box OK',
    timestamp: new Date().toISOString(),
    db: dbInfo,
    frontendUrl: process.env['FRONTEND_URL'] || null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/tables', tableRoutes); // Alias para compatibilidade
// As rotas sensíveis devem receber o middleware CSRF diretamente nos arquivos de rota, se necessário.
app.use('/api/products', productRoutes);
app.use('/api/fillers', fillerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

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
