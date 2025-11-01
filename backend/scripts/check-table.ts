/**
 * Script para verificar se uma mesa existe no banco de dados
 *
 * Como executar:
 * npm exec tsx backend/scripts/check-table.ts [tableId]
 *
 * Exemplos:
 * npm exec tsx backend/scripts/check-table.ts                             (lista todas as mesas)
 * npm exec tsx backend/scripts/check-table.ts 6905a497005cbf0e894758a4    (verifica mesa específica)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Table } from '../models/Table';

dotenv.config();

async function checkTable() {
  try {
    await connectDB();
    console.log('✅ Conectado ao MongoDB\n');

    const tableId = process.argv[2];

    if (tableId) {
      // Busca mesa específica
      console.log(`🔍 Buscando mesa: ${tableId}\n`);

      const table = await Table.findById(tableId);

      if (table) {
        console.log('✅ Mesa encontrada:');
        console.log('─────────────────────────────────');
        console.log(`ID:        ${table._id}`);
        console.log(`Número:    ${table.number}`);
        console.log(`Capacidade: ${table.capacity}`);
        console.log(`Status:    ${table.status}`);
        console.log(`QR Code:   ${table.qrCode}`);
        console.log(`Clientes:  ${table.clients.length}`);
        console.log(`Pedidos:   ${table.currentOrders.length}`);
        console.log('─────────────────────────────────\n');
      } else {
        console.log('❌ Mesa não encontrada\n');
      }
    } else {
      // Lista todas as mesas
      console.log('📋 Todas as mesas:\n');
      const tables = await Table.find().sort({ number: 1 });

      if (tables.length === 0) {
        console.log('⚠️  Nenhuma mesa encontrada no banco de dados\n');
      } else {
        tables.forEach((table, index) => {
          console.log(`${index + 1}. Mesa ${table.number}`);
          console.log(`   ID:     ${table._id}`);
          console.log(`   Status: ${table.status}`);
          console.log(`   QR:     ${table.qrCode}`);
          console.log('');
        });
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkTable();
