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
    // Token enviado automaticamente via cookie httpOnly
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Cria uma nova bill
   */
  createBill(
    billData: CreateBillDTO
  ): Observable<{ success: boolean; data: Bill; message: string }> {
    // 🔒 VALIDAÇÕES DE SEGURANÇA
    if (!billData.finalTotal || billData.finalTotal <= 0) {
      throw new Error('O valor total deve ser maior que zero');
    }

    if (billData.finalTotal > 1000000) {
      throw new Error('Valor total muito alto. Verifique os dados');
    }

    if (billData.subtotal < 0) {
      throw new Error('O subtotal não pode ser negativo');
    }

    if (billData.finalTotal > billData.subtotal) {
      // Permitido - pode ter taxa de serviço
    } else if (billData.finalTotal < 0) {
      throw new Error('O total final não pode ser negativo');
    }

    if (!billData.items || billData.items.length === 0) {
      throw new Error('A conta deve ter pelo menos um item');
    }

    // Validar valores dos itens
    for (const item of billData.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('A quantidade deve ser maior que zero');
      }
      if (item.unitPrice < 0) {
        throw new Error('O preço unitário não pode ser negativo');
      }
      if (item.subtotal < 0) {
        throw new Error('O subtotal do item não pode ser negativo');
      }
      // Validar desconto se existir
      if (item.discount) {
        if (
          item.discount.type === 'percentage' &&
          (item.discount.value < 0 || item.discount.value > 100)
        ) {
          throw new Error('O desconto percentual deve estar entre 0% e 100%');
        }
        if (item.discount.type === 'fixed' && item.discount.value < 0) {
          throw new Error('O desconto fixo não pode ser negativo');
        }
      }
    }

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

  /**
   * Inicia um pagamento online (PIX ou Cartão)
   */
  initiateOnlinePayment(
    id: string,
    paymentData: {
      method: 'pix' | 'credit' | 'debit';
      cardToken?: string; // Token do cartão (se for cartão)
      email?: string; // Email do cliente
    }
  ): Observable<{ success: boolean; data: Bill; message: string }> {
    const headers = this.getHeaders();
    return this.http.post<{ success: boolean; data: Bill; message: string }>(
      `${this.apiUrl}/${id}/initiate-payment`,
      paymentData,
      { headers }
    );
  }

  /**
   * Verifica o status de um pagamento online
   */
  checkPaymentStatus(id: string): Observable<{ success: boolean; data: Bill; message: string }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: Bill; message: string }>(
      `${this.apiUrl}/${id}/payment-status`,
      { headers }
    );
  }
}
