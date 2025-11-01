/**
 * Script para regenerar QR codes de todas as mesas
 *
 * Como executar:
 * npm exec tsx backend/scripts/regenerate-qrcodes.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../config/database';
import { Table } from '../models/Table';

// Carrega variáveis de ambiente do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function regenerateQRCodes() {
  try {
    // Conecta ao MongoDB usando a configuração central (usa MONGODB_URI do .env)
    await connectDB();
    console.log('✅ Conectado ao MongoDB (via connectDB)');

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
