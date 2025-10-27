import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {
    this.loadTables();
  }

  async loadTables(): Promise<void> {
    try {
      const tables = await this.http.get<Table[]>('/api/tables').toPromise();
      this.tablesSubject.next(tables || []);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    }
  }

  async createTable(data: CreateTableDTO): Promise<Table> {
    const table = await this.http.post<Table>('/api/tables', data).toPromise();
    await this.loadTables();
    return table as Table;
  }

  async updateTable(id: string, data: UpdateTableDTO): Promise<Table> {
    const table = await this.http.put<Table>(`/api/tables/${id}`, data).toPromise();
    await this.loadTables();
    return table as Table;
  }

  async deleteTable(id: string): Promise<void> {
    await this.http.delete(`/api/tables/${id}`).toPromise();
    await this.loadTables();
  }

  async openTable(id: string): Promise<Table> {
    const table = await this.http.post<Table>(`/api/tables/${id}/open`, {}).toPromise();
    await this.loadTables();
    return table as Table;
  }

  async closeTable(id: string): Promise<Table> {
    const table = await this.http.post<Table>(`/api/tables/${id}/close`, {}).toPromise();
    await this.loadTables();
    return table as Table;
  }

  async generateQRCode(id: string): Promise<string> {
    const response = await this.http
      .get<{ qrCode: string }>(`/api/tables/${id}/qr-code`)
      .toPromise();
    return response?.qrCode || '';
  }

  async getTableOrders(id: string): Promise<any[]> {
    const orders = await this.http.get<any[]>(`/api/tables/${id}/orders`).toPromise();
    return orders || [];
  }

  getTables(): Table[] {
    return this.tablesSubject.value;
  }

  getTableById(id: string): Table | undefined {
    return this.tablesSubject.value.find(t => t.id === id);
  }
}
