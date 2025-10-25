import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware';

// Carrega variáveis de ambiente
dotenv.config();

// Importa rotas
import authRoutes from './routes/auth';
import tableRoutes from './routes/table';
import productRoutes from './routes/products';
import uploadRoutes from './routes/upload';

const app: Express = express();
const PORT = process.env.PORT || 3001;

/**
 * Middlewares Globais
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve arquivos estáticos de imagens
app.use('/assets/images', express.static(path.join(__dirname, '..', 'src', 'assets', 'images')));

/**
 * Rotas de API
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend Bento Box OK',
    timestamp: new Date().toISOString(),
  });
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rotas de mesas (QR Code join)
app.use('/api/table', tableRoutes);

// Rotas de produtos
app.use('/api/products', productRoutes);

// Rotas de upload de imagens
app.use('/api/upload', uploadRoutes);

/**
 * Middleware de Erro (deve ser o último)
 */
app.use(notFound);
app.use(errorHandler);

/**
 * Inicia o servidor
 */
const startServer = async (): Promise<void> => {
  try {
    // Conecta ao MongoDB
    await connectDB();

    // Inicia o servidor Express
    app.listen(PORT, () => {
      console.log('🚀 Servidor iniciado!');
      console.log(`📡 Rodando na porta: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`✅ Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();

export default app;
