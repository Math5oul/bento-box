/**
 * Script para verificar pedidos no banco de dados
 *
 * Como executar:
 * npm exec tsx backend/scripts/check-order.ts [orderId]
 *
 * Exemplos:
 * npm exec tsx backend/scripts/check-order.ts                    (lista últimos 5 pedidos)
 * npm exec tsx backend/scripts/check-order.ts 6905ac0cedaf75bf8159c3e1  (busca pedido específico)
 */

import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { connectDB } from '../config/database';

async function checkOrder() {
  try {
    // Conecta ao banco
    await connectDB();

    const orderId = process.argv[2];

    if (orderId) {
      // Busca pedido específico
      console.log(`\n🔍 Buscando pedido ${orderId}...\n`);
      const order = await Order.findById(orderId);

      if (order) {
        console.log('✅ Pedido encontrado:');
        console.log('─────────────────────────────────');
        console.log(`ID:           ${order._id}`);
        console.log(`Mesa:         ${order.tableId}`);
        console.log(`ClientID:     ${order.clientId || 'undefined'}`);
        console.log(`ClientName:   "${order.clientName}"`);
        console.log(`SessionToken: ${order.sessionToken || 'undefined'}`);
        console.log(`Total:        R$ ${order.totalAmount.toFixed(2)}`);
        console.log(`Status:       ${order.status}`);
        console.log(`Criado em:    ${order.createdAt}`);
        console.log('─────────────────────────────────\n');
      } else {
        console.log('❌ Pedido não encontrado\n');
      }
    } else {
      // Lista últimos 5 pedidos
      console.log('\n📋 Últimos 5 pedidos:\n');
      const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

      orders.forEach((order, index) => {
        console.log(`${index + 1}. Pedido ${order._id}`);
        console.log(`   Cliente:      "${order.clientName}"`);
        console.log(`   ClientID:     ${order.clientId || 'undefined'}`);
        console.log(`   SessionToken: ${order.sessionToken || 'undefined'}`);
        console.log(`   Total:        R$ ${order.totalAmount.toFixed(2)}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkOrder();
