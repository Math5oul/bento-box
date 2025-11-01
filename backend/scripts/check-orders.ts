/**
 * Script para verificar pedidos no banco de dados
 *
 * Como executar:
 * npm exec tsx backend/scripts/check-orders.ts
 */

import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Order } from '../models/Order';

dotenv.config();

async function checkOrders() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await connectDB();

    console.log('\n📊 Verificando pedidos...\n');

    // Total de pedidos
    const totalOrders = await Order.countDocuments();
    console.log(`📦 Total de pedidos no banco: ${totalOrders}`);

    if (totalOrders === 0) {
      console.log('\n⚠️  Nenhum pedido encontrado no banco de dados!');
      console.log('💡 Dica: Você precisa criar pedidos através da aplicação frontend primeiro.');
      process.exit(0);
    }

    // Pedidos por status
    console.log('\n📈 Pedidos por status:');
    const statuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

    for (const status of statuses) {
      const count = await Order.countDocuments({ status });
      console.log(`   ${status}: ${count} pedido(s)`);
    }

    // Últimos 5 pedidos
    console.log('\n🕐 Últimos 5 pedidos criados:');
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('tableId', 'number')
      .populate('clientId', 'name');

    recentOrders.forEach((order, index) => {
      const tableNum = (order.tableId as any)?.number || '—';
      const clientName = order.clientName || (order.clientId as any)?.name || 'Cliente';
      console.log(`   ${index + 1}. ID: ${order._id}`);
      console.log(`      Mesa: ${tableNum} | Cliente: ${clientName} | Status: ${order.status}`);
      console.log(`      Itens: ${order.items.length} | Total: R$ ${order.totalAmount.toFixed(2)}`);
      console.log(`      Criado em: ${order.createdAt.toLocaleString('pt-BR')}`);
      console.log('');
    });

    console.log('✅ Verificação concluída!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar pedidos:', error);
    process.exit(1);
  }
}

checkOrders();
