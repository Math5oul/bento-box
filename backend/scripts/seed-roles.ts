import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Role, DEFAULT_PERMISSIONS } from '../models/Role';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para popular Roles padrão do sistema
 *
 * Roles de Staff (clientLevel = 0):
 * - Admin
 * - Garçom
 * - Cozinha
 *
 * Roles de Clientes:
 * - Cliente Nível 1 (clientLevel = 1) - Cliente comum
 * - Cliente Nível 2 (clientLevel = 2) - Cliente VIP
 */

const SYSTEM_ROLES = [
  {
    name: 'Administrador',
    slug: 'admin',
    permissions: DEFAULT_PERMISSIONS['admin'],
    isSystem: true,
    clientLevel: 0,
    description: 'Acesso total ao sistema, gerenciamento de usuários, produtos e configurações.',
  },
  {
    name: 'Garçom',
    slug: 'garcom',
    permissions: DEFAULT_PERMISSIONS['waiter'],
    isSystem: true,
    clientLevel: 0,
    description: 'Gerencia pedidos, mesas e pagamentos. Acesso ao painel do garçom.',
  },
  {
    name: 'Cozinha',
    slug: 'cozinha',
    permissions: DEFAULT_PERMISSIONS['kitchen'],
    isSystem: true,
    clientLevel: 0,
    description: 'Visualiza e gerencia pedidos no painel da cozinha.',
  },
  {
    name: 'Cliente',
    slug: 'cliente',
    permissions: DEFAULT_PERMISSIONS['client'],
    isSystem: true,
    clientLevel: 1,
    description: 'Cliente comum - pode fazer pedidos e visualizar cardápio.',
  },
  {
    name: 'Cliente VIP',
    slug: 'cliente-vip',
    permissions: {
      ...DEFAULT_PERMISSIONS['client'],
      canViewTables: true, // Cliente VIP pode ver disponibilidade de mesas
    },
    isSystem: false, // Pode ser customizado
    clientLevel: 2,
    description: 'Cliente VIP - mesmos acessos do cliente comum com benefícios adicionais.',
  },
];

async function seedRoles() {
  try {
    // Conectar ao MongoDB (prioriza MONGODB_URI, depois MONGO_URI, depois localhost)
    const mongoUri =
      process.env['MONGODB_URI'] ||
      process.env['MONGO_URI'] ||
      'mongodb://localhost:27017/bento-box';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB Atlas');

    // Limpar roles existentes (CUIDADO: apenas para desenvolvimento)
    // Descomentar a linha abaixo se quiser limpar todos os roles antes de popular
    // await Role.deleteMany({ isSystem: false });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const roleData of SYSTEM_ROLES) {
      const existingRole = await Role.findOne({ slug: roleData.slug });

      if (existingRole) {
        // Atualizar role existente (apenas se for do sistema)
        if (existingRole.isSystem) {
          await Role.updateOne(
            { slug: roleData.slug },
            {
              $set: {
                name: roleData.name,
                permissions: roleData.permissions,
                description: roleData.description,
                clientLevel: roleData.clientLevel,
              },
            }
          );
          console.log(`🔄 Role atualizado: ${roleData.name} (${roleData.slug})`);
          updated++;
        } else {
          console.log(`⏭️  Role já existe (customizado): ${roleData.name} (${roleData.slug})`);
          skipped++;
        }
      } else {
        // Criar novo role
        await Role.create(roleData);
        console.log(`✨ Role criado: ${roleData.name} (${roleData.slug})`);
        created++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`  - Criados: ${created}`);
    console.log(`  - Atualizados: ${updated}`);
    console.log(`  - Ignorados: ${skipped}`);
    console.log(`  - Total: ${SYSTEM_ROLES.length}`);

    // Listar todos os roles
    const allRoles = await Role.find().sort({ clientLevel: 1, name: 1 });
    console.log('\n📋 Roles no sistema:');
    for (const role of allRoles) {
      const levelLabel = role.clientLevel === 0 ? 'Staff' : `Cliente Nível ${role.clientLevel}`;
      console.log(`  - ${role.name} (${role.slug}) [${levelLabel}]${role.isSystem ? ' 🔒' : ''}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado do MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular roles:', error);
    process.exit(1);
  }
}

// Executar script
seedRoles();
