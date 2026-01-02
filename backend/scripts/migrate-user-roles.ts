import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Role } from '../models/Role';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para migrar roles de usuários de string para ObjectId
 *
 * Este script:
 * 1. Busca todos os usuários que têm role como string
 * 2. Mapeia as strings antigas para os slugs dos novos roles
 * 3. Atualiza os usuários com o ObjectId do role correspondente
 */

const ROLE_MAPPING: Record<string, string> = {
  'admin': 'admin',
  'client': 'cliente',
  'cozinha': 'cozinha',
  'garcom': 'garcom',
  'table': 'cliente', // Role 'table' vira 'cliente'
};

async function migrateUserRoles() {
  try {
    // Conectar ao MongoDB
    const mongoUri =
      process.env['MONGODB_URI'] ||
      process.env['MONGO_URI'] ||
      'mongodb://localhost:27017/bento-box';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');

    // Buscar todos os usuários
    const users = await User.find({}).select('name email role isAnonymous');
    console.log(`\n📊 Total de usuários: ${users.length}`);

    let migrated = 0;
    let alreadyObjectId = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Verifica se já é ObjectId
        if (user.role instanceof mongoose.Types.ObjectId) {
          alreadyObjectId++;
          continue;
        }

        // Se for string, migra
        const roleString = user.role as any as string;
        const targetSlug = ROLE_MAPPING[roleString] || 'cliente';

        // Busca o role no banco
        const roleDoc = await Role.findOne({ slug: targetSlug });

        if (!roleDoc) {
          console.error(`❌ Role "${targetSlug}" não encontrado para usuário ${user.name} (${user.email})`);
          failed++;
          continue;
        }

        // Atualiza o usuário
        await User.updateOne(
          { _id: user._id },
          { $set: { role: roleDoc._id } }
        );

        console.log(`✅ Migrado: ${user.name} (${user.email || 'anônimo'}) - ${roleString} → ${targetSlug}`);
        migrated++;
      } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${user.name}:`, error);
        failed++;
      }
    }

    console.log(`\n📊 Resumo da migração:`);
    console.log(`  - Migrados: ${migrated}`);
    console.log(`  - Já eram ObjectId: ${alreadyObjectId}`);
    console.log(`  - Falhas: ${failed}`);
    console.log(`  - Total: ${users.length}`);

    // Desconectar
    await mongoose.disconnect();
    console.log('\n✅ Desconectado do MongoDB');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrateUserRoles();
