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

  res.json({
    success: true,
    message: 'Backend Bento Box OK',
    timestamp: new Date().toISOString(),
    db: dbInfo,
    mongoUri: mongoUri, // URI completa para Compass
    frontendUrl: process.env['FRONTEND_URL'] || null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/tables', tableRoutes); // Alias para compatibilidade
app.use('/api/products', productRoutes);
app.use('/api/fillers', fillerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

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
