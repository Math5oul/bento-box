/**
 * Script para exportar todo o banco de dados atual
 * Gera um arquivo JSON com backup completo
 */

import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Modelos
import Product from '../models/Product';
import { Category } from '../models/Category';
import Filler from '../models/Filler';
import { Table } from '../models/Table';
import { User } from '../models/User';
import { Order } from '../models/Order';

dotenv.config();

async function exportDatabase() {
  try {
    console.log('📦 Iniciando exportação do banco de dados...\n');

    await connectDB();

    // Exportar todas as coleções
    const [products, categories, fillers, tables, users, orders] = await Promise.all([
      Product.find({}).lean(),
      Category.find({}).lean(),
      Filler.find({}).lean(),
      Table.find({}).lean(),
      User.find({}).lean(),
      Order.find({}).lean(),
    ]);

    const databaseSnapshot = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      collections: {
        products,
        categories,
        fillers,
        tables,
        users,
        orders,
      },
      stats: {
        products: products.length,
        categories: categories.length,
        fillers: fillers.length,
        tables: tables.length,
        users: users.length,
        orders: orders.length,
      },
    };

    // Salvar em arquivo
    const backupDir = path.join(__dirname, '..', '..', 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `database-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(databaseSnapshot, null, 2), 'utf-8');

    // Nota: agora mantemos apenas arquivos timestamped no diretório de backup

    console.log('✅ Exportação concluída!\n');
    console.log('📊 Estatísticas:');
    console.log(`   📦 Produtos: ${products.length}`);
    console.log(`   🏷️  Categorias: ${categories.length}`);
    console.log(`   🎨 Fillers: ${fillers.length}`);
    console.log(`   🪑 Mesas: ${tables.length}`);
    console.log(`   👤 Usuários: ${users.length}`);
    console.log(`   📋 Pedidos: ${orders.length}`);
    console.log(`\n💾 Backup salvo em:`);
    console.log(`   ${filepath}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao exportar banco:', error);
    process.exit(1);
  }
}

exportDatabase();
