import express, { Request, Response } from 'express';
import { Role, IRole } from '../models/Role';
import { User } from '../models/User';
import { auditLog } from '../middleware/auditLogger';

const router = express.Router();

/**
 * GET /api/roles
 * Lista todos os perfis
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ clientLevel: 1, name: 1 });

    res.json({
      success: true,
      roles,
    });
  } catch (error: any) {
    console.error('Erro ao buscar roles:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfis',
      error: error.message,
    });
  }
});

/**
 * GET /api/roles/:id
 * Busca um perfil específico
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado',
      });
    }

    res.json({
      success: true,
      role,
    });
  } catch (error: any) {
    console.error('Erro ao buscar role:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil',
      error: error.message,
    });
  }
});

/**
 * POST /api/roles
 * Cria um novo perfil
 */
router.post('/', auditLog('CREATE_ROLE', 'roles'), async (req: Request, res: Response) => {
  try {
    const { name, slug, permissions, clientLevel, description } = req.body;

    // Validações
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Nome e slug são obrigatórios',
      });
    }

    // Verificar se slug já existe
    const existingRole = await Role.findOne({ slug });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um perfil com este slug',
      });
    }

    // Criar novo role
    const newRole = await Role.create({
      name,
      slug,
      permissions: permissions || {},
      clientLevel: clientLevel || 1,
      description: description || '',
      isSystem: false, // Perfis criados via API não são do sistema
    });

    res.status(201).json({
      success: true,
      message: 'Perfil criado com sucesso',
      role: newRole,
    });
  } catch (error: any) {
    console.error('Erro ao criar role:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar perfil',
      error: error.message,
    });
  }
});

/**
 * PUT /api/roles/:id
 * Atualiza um perfil existente
 */
router.put('/:id', auditLog('UPDATE_ROLE', 'roles'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, permissions, clientLevel, description } = req.body;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado',
      });
    }

    // Não permitir editar perfis do sistema (apenas permissões)
    if (role.isSystem && (name || slug || clientLevel !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Apenas permissões de perfis do sistema podem ser editadas',
      });
    }

    // Verificar se novo slug já existe (se foi alterado)
    if (slug && slug !== role.slug) {
      const existingRole = await Role.findOne({ slug });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um perfil com este slug',
        });
      }
    }

    // Atualizar role
    if (name) role.name = name;
    if (slug) role.slug = slug;
    if (permissions) role.permissions = permissions;
    if (clientLevel !== undefined) role.clientLevel = clientLevel;
    if (description !== undefined) role.description = description;

    await role.save();

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      role,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/roles/:id
 * Deleta um perfil e migra usuários para outro role
 */
router.delete('/:id', auditLog('DELETE_ROLE', 'roles'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { migrateToRoleId } = req.body; // Role de destino para migração

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado',
      });
    }

    // Não permitir deletar perfis do sistema
    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Perfis do sistema não podem ser deletados',
      });
    }

    // DEBUG: Ver todos os roles únicos dos usuários
    const allUserRoles = await User.distinct('role');
    console.log(`🔍 DEBUG - Roles únicos no banco:`, allUserRoles);
    console.log(`🔍 DEBUG - Role sendo deletado:`, role._id, 'tipo:', typeof role._id);
    console.log(`🔍 DEBUG - Role slug:`, role.slug);

    // Verificar se existem usuários com este role
    // Busca por ObjectId ou por slug (para roles legacy que podem estar como string)
    const usersWithRoleByObjectId = await User.countDocuments({ role: role._id });
    const usersWithRoleBySlug = await User.countDocuments({ role: role.slug });

    // Também tenta buscar como string do ObjectId
    const usersWithRoleAsString = await User.countDocuments({ role: role._id.toString() });

    const usersWithRole = usersWithRoleByObjectId + usersWithRoleBySlug + usersWithRoleAsString;

    console.log(`📊 Role "${role.name}" (${role._id}) possui:`);
    console.log(`   - ${usersWithRoleByObjectId} usuário(s) com ObjectId`);
    console.log(`   - ${usersWithRoleBySlug} usuário(s) com slug "${role.slug}"`);
    console.log(`   - ${usersWithRoleAsString} usuário(s) com ObjectId como string`);
    console.log(`   - Total: ${usersWithRole} usuário(s)`);

    if (usersWithRole > 0) {
      // Se existem usuários mas não foi fornecido role de destino
      if (!migrateToRoleId) {
        console.log(`⚠️ Bloqueando deleção - precisa migrar ${usersWithRole} usuário(s)`);
        return res.status(400).json({
          success: false,
          message: `Não é possível deletar este perfil pois ${usersWithRole} usuário(s) ainda o utilizam`,
          requiresMigration: true,
          usersCount: usersWithRole,
        });
      }

      // Validar role de destino
      const targetRole = await Role.findById(migrateToRoleId);
      if (!targetRole) {
        return res.status(400).json({
          success: false,
          message: 'Perfil de destino para migração não encontrado',
        });
      }

      // Não permitir migrar para o próprio role sendo deletado
      if (targetRole._id.toString() === role._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível migrar usuários para o mesmo perfil sendo deletado',
        });
      }

      // Migrar todos os usuários para o novo role (ObjectId, string, e slug)
      const updateResultById = await User.updateMany(
        { role: role._id },
        { $set: { role: targetRole._id } }
      );

      const updateResultByString = await User.updateMany(
        { role: role._id.toString() },
        { $set: { role: targetRole._id } }
      );

      const updateResultBySlug = await User.updateMany(
        { role: role.slug },
        { $set: { role: targetRole._id } }
      );

      const totalMigrated =
        updateResultById.modifiedCount +
        updateResultByString.modifiedCount +
        updateResultBySlug.modifiedCount;
      console.log(
        `✅ ${totalMigrated} usuários migrados de "${role.name}" para "${targetRole.name}"`
      );
      console.log(`   - ${updateResultById.modifiedCount} por ObjectId`);
      console.log(`   - ${updateResultByString.modifiedCount} por ObjectId como string`);
      console.log(`   - ${updateResultBySlug.modifiedCount} por slug`);
    }

    // Deletar o role
    await Role.findByIdAndDelete(id);

    res.json({
      success: true,
      message:
        usersWithRole > 0
          ? `Perfil deletado com sucesso. ${usersWithRole} usuário(s) migrado(s) para o novo perfil.`
          : 'Perfil deletado com sucesso',
      migratedUsers: usersWithRole,
    });
  } catch (error: any) {
    console.error('Erro ao deletar role:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar perfil',
      error: error.message,
    });
  }
});

/**
 * GET /api/roles/client-levels/list
 * Lista os níveis de cliente disponíveis (para descontos em categorias)
 */
router.get('/client-levels/list', async (req: Request, res: Response) => {
  try {
    // Buscar roles de clientes (clientLevel > 0)
    const clientRoles = await Role.find({ clientLevel: { $gt: 0 } })
      .select('name clientLevel slug')
      .sort({ clientLevel: 1 });

    const clientLevels = clientRoles.map(role => ({
      level: role.clientLevel,
      name: role.name,
      slug: role.slug,
    }));

    res.json({
      success: true,
      clientLevels,
    });
  } catch (error: any) {
    console.error('Erro ao buscar client levels:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar níveis de cliente',
      error: error.message,
    });
  }
});

export default router;
