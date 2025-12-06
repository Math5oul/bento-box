import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import {
  Table,
  TableStatus,
  CreateTableDTO,
  UpdateTableDTO,
} from '../../interfaces/table.interface';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private tablesSubject = new BehaviorSubject<Table[]>([]);
  public tables$ = this.tablesSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadTables();
  }

  private getHeaders(): HttpHeaders {
    // Token enviado automaticamente via cookie httpOnly
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  async loadTables(): Promise<void> {
    try {
      const response = await this.http
        .get<{ success: boolean; tables: Table[] }>('/api/tables', {
          headers: this.getHeaders(),
        })
        .toPromise();
      this.tablesSubject.next(response?.tables || []);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      this.tablesSubject.next([]);
    }
  }

  async createTable(data: CreateTableDTO): Promise<Table> {
    const response = await this.http
      .post<{ success: boolean; table: Table }>('/api/tables', data, {
        headers: this.getHeaders(),
      })
      .toPromise();
    await this.loadTables();
    return response?.table as Table;
  }

  async updateTable(id: string, data: UpdateTableDTO): Promise<Table> {
    const response = await this.http
      .put<{ success: boolean; table: Table }>(`/api/tables/${id}`, data, {
        headers: this.getHeaders(),
      })
      .toPromise();
    await this.loadTables();
    return response?.table as Table;
  }

  async deleteTable(id: string): Promise<void> {
    await this.http.delete(`/api/tables/${id}`, { headers: this.getHeaders() }).toPromise();
    await this.loadTables();
  }

  async openTable(id: string): Promise<Table> {
    const response = await this.http
      .post<{ success: boolean; table: Table }>(
        `/api/tables/${id}/open`,
        {},
        {
          headers: this.getHeaders(),
        }
      )
      .toPromise();
    await this.loadTables();
    return response?.table as Table;
  }

  async closeTable(id: string): Promise<Table> {
    const response = await this.http
      .post<{ success: boolean; table: Table }>(
        `/api/tables/${id}/close`,
        {},
        {
          headers: this.getHeaders(),
        }
      )
      .toPromise();
    await this.loadTables();
    return response?.table as Table;
  }

  async clearTable(id: string): Promise<Table> {
    const response = await this.http
      .post<{ success: boolean; table: Table }>(
        `/api/tables/${id}/clear`,
        {},
        {
          headers: this.getHeaders(),
        }
      )
      .toPromise();
    await this.loadTables();
    return response?.table as Table;
  }

  async reserveTable(
    id: string,
    data: { clientName: string; clientPhone: string; dateTime: string; notes?: string }
  ): Promise<Table> {
    const response = await this.http
      .post<{ success: boolean; table: Table }>(`/api/tables/${id}/reserve`, data, {
        headers: this.getHeaders(),
      })
      .toPromise();
    await this.loadTables();
    return response?.table as Table;
  }

  async generateQRCode(id: string): Promise<string> {
    const response = await this.http
      .get<{ success: boolean; qrCode: string }>(`/api/tables/${id}/qrcode`, {
        headers: this.getHeaders(),
      })
      .toPromise();
    return response?.qrCode || '';
  }

  async getTableOrders(id: string): Promise<any[]> {
    const response = await this.http
      .get<{ success: boolean; orders: any[] }>(`/api/tables/${id}/orders`, {
        headers: this.getHeaders(),
      })
      .toPromise();
    return response?.orders || [];
  }

  getTables(): Table[] {
    return this.tablesSubject.value;
  }

  getTableById(id: string): Table | undefined {
    return this.tablesSubject.value.find(t => t.id === id);
  }
}
