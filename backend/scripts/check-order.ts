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
      const order = await Order.findById(orderId);

      if (order) {
        // Pedido encontrado — saída removida per request
      } else {
        // Pedido não encontrado — output removed
      }
    } else {
      // Lista últimos 5 pedidos — output removed per request
      const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

      orders.forEach((order, index) => {
        // summary suppressed
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkOrder();
