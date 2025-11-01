/**
 * Script para restaurar todo o banco de dados a partir do backup
 *
 * Uso:
 *   npm run seed:restore                    # Restaura do backup mais recente
 *   npm run seed:restore -- backup-file.json # Restaura de arquivo específico
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

interface BackupData {
  exportDate: string;
  version: string;
  collections: {
    products: any[];
    categories: any[];
    fillers: any[];
    tables: any[];
    users: any[];
    orders: any[];
  };
  stats: {
    products: number;
    categories: number;
    fillers: number;
    tables: number;
    users: number;
    orders: number;
  };
}

async function restoreDatabase() {
  try {
    console.log('🔄 Iniciando restauração do banco de dados...\n');

    // Determinar arquivo de backup
    const backupDir = path.join(__dirname, '..', '..', 'backup');
    let backupFile: string;

    const customFile = process.argv[2];
    if (customFile) {
      backupFile = path.join(backupDir, customFile);
      if (!fs.existsSync(backupFile)) {
        console.error(`❌ Arquivo não encontrado: ${backupFile}`);
        process.exit(1);
      }
    } else {
      backupFile = path.join(backupDir, 'database-current.json');
      if (!fs.existsSync(backupFile)) {
        console.error('❌ Nenhum backup encontrado. Execute primeiro: npm run seed:export');
        process.exit(1);
      }
    }

    console.log(`📂 Carregando backup: ${path.basename(backupFile)}`);

    // Carregar dados do backup
    const backupData: BackupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
    console.log(`📅 Data do backup: ${new Date(backupData.exportDate).toLocaleString('pt-BR')}`);
    console.log(`📊 Versão: ${backupData.version}\n`);

    await connectDB();

    // Limpar banco de dados
    console.log('🗑️  Limpando banco de dados atual...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Filler.deleteMany({}),
      Table.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('✅ Banco limpo\n');

    // Restaurar dados
    console.log('📥 Restaurando dados...\n');

    const results = {
      categories: 0,
      products: 0,
      fillers: 0,
      tables: 0,
      users: 0,
      orders: 0,
    };

    // 1. Categorias (primeiro, pois produtos podem referenciar)
    if (backupData.collections.categories.length > 0) {
      const cats = await Category.insertMany(backupData.collections.categories);
      results.categories = cats.length;
      console.log(`   ✅ ${results.categories} categorias restauradas`);
    }

    // 2. Produtos
    if (backupData.collections.products.length > 0) {
      const prods = await Product.insertMany(backupData.collections.products);
      results.products = prods.length;
      console.log(`   ✅ ${results.products} produtos restaurados`);
    }

    // 3. Fillers
    if (backupData.collections.fillers.length > 0) {
      const fills = await Filler.insertMany(backupData.collections.fillers);
      results.fillers = fills.length;
      console.log(`   ✅ ${results.fillers} fillers restaurados`);
    }

    // 4. Mesas
    if (backupData.collections.tables.length > 0) {
      const tabs = await Table.insertMany(backupData.collections.tables);
      results.tables = tabs.length;
      console.log(`   ✅ ${results.tables} mesas restauradas`);
    }

    // 5. Usuários
    if (backupData.collections.users.length > 0) {
      const usrs = await User.insertMany(backupData.collections.users);
      results.users = usrs.length;
      console.log(`   ✅ ${results.users} usuários restaurados`);
    }

    // 6. Pedidos
    if (backupData.collections.orders.length > 0) {
      const ords = await Order.insertMany(backupData.collections.orders);
      results.orders = ords.length;
      console.log(`   ✅ ${results.orders} pedidos restaurados`);
    }

    console.log('\n🎉 Restauração concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   🏷️  Categorias: ${results.categories}`);
    console.log(`   📦 Produtos: ${results.products}`);
    console.log(`   🎨 Fillers: ${results.fillers}`);
    console.log(`   🪑 Mesas: ${results.tables}`);
    console.log(`   👤 Usuários: ${results.users}`);
    console.log(`   📋 Pedidos: ${results.orders}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao restaurar banco:', error);
    process.exit(1);
  }
}

restoreDatabase();
