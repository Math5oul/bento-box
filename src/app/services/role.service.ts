import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, CreateRoleDTO, ClientLevel } from '../interfaces/role.interface';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Retorna headers com autenticação
   */
  private getHeaders(): HttpHeaders {
    // Token enviado automaticamente via cookie httpOnly
    // Authorization header não é mais necessário
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Lista todos os perfis
   */
  async getRoles(): Promise<Role[]> {
    try {
      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<{ roles: Role[] }>(this.apiUrl, { headers })
      );
      return response.roles || [];
    } catch (error) {
      console.error('Erro ao buscar perfis');
      throw new Error('Erro ao carregar perfis');
    }
  }

  /**
   * Busca um perfil por ID
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<{ role: Role }>(`${this.apiUrl}/${id}`, { headers })
      );
      return response.role;
    } catch (error) {
      console.error('Erro ao buscar perfil');
      throw new Error('Erro ao carregar perfil');
    }
  }

  /**
   * Cria um novo perfil
   */
  async createRole(roleData: CreateRoleDTO): Promise<Role> {
    try {
      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.http.post<{ role: Role }>(this.apiUrl, roleData, { headers })
      );
      return response.role;
    } catch (error: any) {
      console.error('Erro ao criar perfil');
      throw new Error(error?.error?.message || 'Erro ao criar perfil');
    }
  }

  /**
   * Atualiza um perfil existente
   */
  async updateRole(id: string, roleData: Partial<CreateRoleDTO>): Promise<Role> {
    try {
      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.http.put<{ role: Role }>(`${this.apiUrl}/${id}`, roleData, { headers })
      );
      return response.role;
    } catch (error: any) {
      console.error('Erro ao atualizar perfil');
      throw new Error(error?.error?.message || 'Erro ao atualizar perfil');
    }
  }

  /**
   * Deleta um perfil (com opção de migrar usuários para outro perfil)
   */
  async deleteRole(id: string, migrateToRoleId?: string): Promise<void> {
    try {
      console.log('🌐 RoleService.deleteRole - id:', id, 'migrateToRoleId:', migrateToRoleId);

      const headers = this.getHeaders();
      const body = migrateToRoleId ? { migrateToRoleId } : {};

      const response = await firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/${id}`, {
          headers,
          body: migrateToRoleId ? body : undefined,
        })
      );

      console.log('✅ Role deletado com sucesso');
    } catch (error: any) {
      console.error('💥 Erro ao deletar perfil');

      // Verificar se o erro requer migração
      if (error?.error?.requiresMigration) {
        console.log('⚠️ Precisa de migração! usersCount:', error.error.usersCount);
        const migrationError: any = new Error(error.error.message || 'Perfil possui usuários');
        migrationError.requiresMigration = true;
        migrationError.usersCount = error.error.usersCount;
        throw migrationError;
      }

      throw new Error(error?.error?.message || 'Erro ao deletar perfil');
    }
  }

  /**
   * Lista os níveis de cliente disponíveis (para usar em descontos)
   */
  async getClientLevels(): Promise<ClientLevel[]> {
    try {
      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<{ clientLevels: ClientLevel[] }>(`${this.apiUrl}/client-levels/list`, {
          headers,
        })
      );
      return response.clientLevels || [];
    } catch (error) {
      console.error('Erro ao buscar níveis de cliente');
      throw new Error('Erro ao carregar níveis de cliente');
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
