import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Configuração do MongoDB
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bento-box';

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB conectado com sucesso!');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Eventos de Conexão
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', err => {
  console.error('❌ Erro de conexão Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado do MongoDB');
});

/**
 * Graceful Shutdown
 */
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 Conexão MongoDB fechada (SIGINT)');
  process.exit(0);
});
