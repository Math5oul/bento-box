import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Table } from '../models/Table';

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function regenerateQRCodes() {
  try {
    // Conecta ao MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bento-box';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');

    // Busca todas as mesas
    const tables = await Table.find();
    console.log(`📋 Encontradas ${tables.length} mesas`);

    // Regenera QR Code para cada mesa
    for (const table of tables) {
      const oldQRCode = table.qrCode;
      await table.generateQRCode();
      await table.save();
      console.log(`✅ Mesa ${table.number}: ${oldQRCode} → ${table.qrCode}`);
    }

    console.log('🎉 QR Codes regenerados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao regenerar QR Codes:', error);
    process.exit(1);
  }
}

regenerateQRCodes();
