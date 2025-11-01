/**
 * Script para limpar usuários anônimos do banco de dados
 *
 * Como executar:
 * npm exec tsx backend/scripts/clean-anonymous-users.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';

// Carrega variáveis de ambiente
dotenv.config();

async function cleanAnonymousUsers() {
  try {
    // Conecta ao MongoDB
    await connectDB();
    console.log('✅ Conectado ao MongoDB');

    // Busca todos os usuários anônimos
    const anonymousUsers = await User.find({ isAnonymous: true });
    console.log(`\n📋 Encontrados ${anonymousUsers.length} usuários anônimos`);

    if (anonymousUsers.length === 0) {
      console.log('✨ Nenhum usuário anônimo para remover');
      await mongoose.disconnect();
      return;
    }

    // Lista os usuários que serão removidos
    console.log('\n🗑️  Usuários que serão removidos:');
    anonymousUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user._id} - ${user.name} (SessionToken: ${user.sessionToken})`
      );
    });

    // Remove todos os usuários anônimos
    const result = await User.deleteMany({ isAnonymous: true });
    console.log(`\n✅ ${result.deletedCount} usuário(s) anônimo(s) removido(s) com sucesso!`);

    // Desconecta do MongoDB
    await mongoose.disconnect();
    console.log('👋 Desconectado do MongoDB');
  } catch (error) {
    console.error('❌ Erro ao limpar usuários anônimos:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Executa o script
cleanAnonymousUsers();
