import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface POSPaymentRequest {
  paymentType: 'credit' | 'debit' | 'pix';
}

export interface POSPaymentResponse {
  success: boolean;
  message: string;
  data?: any;
  approved?: boolean;
  receiptText?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PosTerminalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bills`;

  /**
   * Retorna headers com autenticação
   */
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Envia pagamento para maquininha
   */
  sendToPOS(
    billId: string,
    paymentType: 'credit' | 'debit' | 'pix'
  ): Observable<POSPaymentResponse> {
    const headers = this.getHeaders();
    return this.http.post<POSPaymentResponse>(
      `${this.apiUrl}/${billId}/send-to-pos`,
      { paymentType },
      { headers }
    );
  }

  /**
   * Verifica status do pagamento na maquininha
   */
  checkPOSStatus(billId: string): Observable<POSPaymentResponse> {
    const headers = this.getHeaders();
    return this.http.get<POSPaymentResponse>(`${this.apiUrl}/${billId}/pos-status`, { headers });
  }

  /**
   * Verifica se POS está habilitado (via settings)
   */
  async isPOSEnabled(): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await this.http
        .get<any>(`${environment.apiUrl}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .toPromise();

      return response?.posTerminal?.enabled === true;
    } catch (error) {
      console.error('Erro ao verificar status do POS:', error);
      return false;
    }
  }
}
