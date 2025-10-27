import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Order, OrderStatus, CreateOrderDTO } from '../../interfaces/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

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

  private getSessionToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('sessionToken');
  }

  /**
   * Cria um novo pedido
   */
  createOrder(orderData: CreateOrderDTO): Observable<any> {
    const headers = this.getHeaders();

    // Se não tem sessionToken no DTO, pega do localStorage
    if (!orderData.sessionToken) {
      orderData.sessionToken = this.getSessionToken() || undefined;
    }

    return this.http.post('/api/orders', orderData, { headers });
  }

  /**
   * Busca todos os pedidos e agrupa por mesa (Admin)
   */
  getAllOrdersGroupedByTable(): Observable<
    { tableNumber: number; tableId: string; orders: Order[] }[]
  > {
    return this.getAllOrders().pipe(
      map((response: any) => {
        const orders: Order[] = response.orders || [];
        const grouped: Record<string, { tableNumber: number; tableId: string; orders: Order[] }> =
          {};
        for (const order of orders) {
          const tableId = order.tableId;
          // Se não vier tableNumber, coloca 0 (ou buscar depois)
          const tableNumber = (order as any).tableNumber || 0;
          if (!grouped[tableId]) {
            grouped[tableId] = { tableNumber, tableId, orders: [] };
          }
          grouped[tableId].orders.push(order);
        }
        return Object.values(grouped).sort((a, b) => a.tableNumber - b.tableNumber);
      })
    );
  }

  /**
   * Busca pedidos de uma mesa específica (Admin)
   */
  getTableOrders(tableId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`/api/orders/table/${tableId}`, { headers });
  }

  /**
   * Atualiza status de um pedido (Admin)
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`/api/orders/${orderId}/status`, { status }, { headers });
  }

  /**
   * Cancela um pedido
   */
  cancelOrder(orderId: string): Observable<any> {
    const headers = this.getHeaders();
    const sessionToken = this.getSessionToken();

    let params = new HttpParams();
    if (sessionToken) {
      params = params.set('sessionToken', sessionToken);
    }

    return this.http.delete(`/api/orders/${orderId}`, { headers, params });
  }

  /**
   * Lista todos os pedidos (Admin - com filtros)
   */
  getAllOrders(filters?: { status?: OrderStatus; tableId?: string }): Observable<any> {
    const headers = this.getHeaders();

    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.tableId) {
      params = params.set('tableId', filters.tableId);
    }

    return this.http.get('/api/orders', { headers, params });
  }

  /**
   * Retorna snapshot atual dos pedidos
   */
  getCurrentOrders(): Order[] {
    return [...this.ordersSubject.value];
  }

  /**
   * Retorna pedidos ativos (não entregues/cancelados)
   */
  getActiveOrders(): Order[] {
    return this.getCurrentOrders().filter(
      order => order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED
    );
  }

  /**
   * Calcula total de todos os pedidos
   */
  getTotalAmount(): number {
    return this.getCurrentOrders().reduce((sum, order) => sum + order.totalAmount, 0);
  }

  /**
   * Mapeia status para label em português
   */
  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pendente',
      [OrderStatus.CONFIRMED]: 'Confirmado',
      [OrderStatus.PREPARING]: 'Preparando',
      [OrderStatus.READY]: 'Pronto',
      [OrderStatus.DELIVERED]: 'Entregue',
      [OrderStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status] || status;
  }

  /**
   * Retorna cor do status
   */
  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#ff9800',
      [OrderStatus.CONFIRMED]: '#2196f3',
      [OrderStatus.PREPARING]: '#9c27b0',
      [OrderStatus.READY]: '#4caf50',
      [OrderStatus.DELIVERED]: '#8bc34a',
      [OrderStatus.CANCELLED]: '#f44336',
    };
    return colors[status] || '#999';
  }
}
