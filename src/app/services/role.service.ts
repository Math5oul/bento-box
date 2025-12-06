import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Role, CreateRoleDTO, ClientLevel } from '../interfaces/role.interface';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor() {}

  /**
   * Lista todos os perfis
   */
  async getRoles(): Promise<Role[]> {
    try {
      const response = await fetch(this.apiUrl, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar perfis');
      }

      const data = await response.json();
      return data.roles || [];
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      throw error;
    }
  }

  /**
   * Busca um perfil por ID
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar perfil');
      }

      const data = await response.json();
      return data.role;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Cria um novo perfil
   */
  async createRole(roleData: CreateRoleDTO): Promise<Role> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar perfil');
      }

      const data = await response.json();
      return data.role;
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      throw error;
    }
  }

  /**
   * Atualiza um perfil existente
   */
  async updateRole(id: string, roleData: Partial<CreateRoleDTO>): Promise<Role> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar perfil');
      }

      const data = await response.json();
      return data.role;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Deleta um perfil (com opção de migrar usuários para outro perfil)
   */
  async deleteRole(id: string, migrateToRoleId?: string): Promise<void> {
    try {
      console.log('🌐 RoleService.deleteRole - id:', id, 'migrateToRoleId:', migrateToRoleId);

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
        body: migrateToRoleId ? JSON.stringify({ migrateToRoleId }) : undefined,
      });

      console.log('📡 Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error data from API:', errorData);

        // Se precisa de migração, lança erro com dados extras
        if (errorData.requiresMigration) {
          console.log('⚠️ Precisa de migração! usersCount:', errorData.usersCount);
          const error: any = new Error(errorData.message || 'Perfil possui usuários');
          error.requiresMigration = true;
          error.usersCount = errorData.usersCount;
          throw error;
        }

        throw new Error(errorData.message || 'Erro ao deletar perfil');
      }

      console.log('✅ Role deletado com sucesso');
    } catch (error) {
      console.error('💥 Erro ao deletar perfil (service):', error);
      throw error;
    }
  }

  /**
   * Lista os níveis de cliente disponíveis (para usar em descontos)
   */
  async getClientLevels(): Promise<ClientLevel[]> {
    try {
      const response = await fetch(`${this.apiUrl}/client-levels/list`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar níveis de cliente');
      }

      const data = await response.json();
      return data.clientLevels || [];
    } catch (error) {
      console.error('Erro ao buscar níveis de cliente:', error);
      throw error;
    }
  }

  /**
   * Agrupa roles por tipo (staff vs clientes)
   */
  groupRolesByType(roles: Role[]): { staff: Role[]; clients: Role[] } {
    return {
      staff: roles.filter(role => role.clientLevel === 0),
      clients: roles.filter(role => role.clientLevel > 0),
    };
  }

  /**
   * Retorna label amigável para client level
   */
  getClientLevelLabel(level: number): string {
    if (level === 0) return 'Staff';
    if (level === 1) return 'Cliente Comum';
    if (level === 2) return 'Cliente VIP';
    return `Cliente Nível ${level}`;
  }
}
