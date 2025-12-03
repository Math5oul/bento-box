import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Bill,
  CreateBillDTO,
  UpdateBillStatusDTO,
  BillSummary,
  BillStatus,
} from '../interfaces/bill.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BillService {
  private apiUrl = `${environment.apiUrl}/bills`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getHeaders(): HttpHeaders {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('auth_token') : null;
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /**
   * Cria uma nova bill
   */
  createBill(
    billData: CreateBillDTO
  ): Observable<{ success: boolean; data: Bill; message: string }> {
    const headers = this.getHeaders();
    return this.http.post<{ success: boolean; data: Bill; message: string }>(
      this.apiUrl,
      billData,
      { headers }
    );
  }

  /**
   * Lista bills com filtros opcionais
   */
  getBills(params?: {
    tableId?: string;
    status?: BillStatus;
    limit?: number;
    skip?: number;
  }): Observable<{
    success: boolean;
    data: Bill[];
    pagination: {
      total: number;
      limit: number;
      skip: number;
      hasMore: boolean;
    };
  }> {
    const headers = this.getHeaders();
    let httpParams = new HttpParams();

    if (params) {
      if (params.tableId) httpParams = httpParams.set('tableId', params.tableId);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.skip) httpParams = httpParams.set('skip', params.skip.toString());
    }

    return this.http.get<{
      success: boolean;
      data: Bill[];
      pagination: {
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
      };
    }>(this.apiUrl, { params: httpParams, headers });
  }

  /**
   * Obtém detalhes de uma bill específica
   */
  getBillById(id: string): Observable<{ success: boolean; data: Bill }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: Bill }>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Atualiza o status de uma bill
   */
  updateBillStatus(
    id: string,
    statusData: UpdateBillStatusDTO
  ): Observable<{ success: boolean; data: Bill; message: string }> {
    const headers = this.getHeaders();
    return this.http.patch<{ success: boolean; data: Bill; message: string }>(
      `${this.apiUrl}/${id}/status`,
      statusData,
      { headers }
    );
  }

  /**
   * Obtém resumo de bills de uma mesa
   */
  getTableBillsSummary(tableId: string): Observable<{ success: boolean; data: BillSummary }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: BillSummary }>(
      `${this.apiUrl}/table/${tableId}/summary`,
      { headers }
    );
  }

  /**
   * Deleta uma bill (apenas se pendente ou cancelada)
   */
  deleteBill(id: string): Observable<{ success: boolean; message: string }> {
    const headers = this.getHeaders();
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, {
      headers,
    });
  }

  /**
   * Marca uma bill como paga
   */
  markAsPaid(
    id: string,
    paymentMethod: string
  ): Observable<{ success: boolean; data: Bill; message: string }> {
    return this.updateBillStatus(id, {
      status: BillStatus.PAID,
      paymentMethod: paymentMethod as any,
    });
  }

  /**
   * Cancela uma bill
   */
  cancelBill(id: string): Observable<{ success: boolean; data: Bill; message: string }> {
    return this.updateBillStatus(id, {
      status: BillStatus.CANCELLED,
    });
  }
}
