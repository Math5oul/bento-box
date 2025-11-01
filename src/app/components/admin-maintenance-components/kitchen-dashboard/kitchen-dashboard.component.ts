import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../interfaces/user.interface';
import { AuthService } from '../../../services/auth-service/auth.service';

interface KitchenOrderItem {
  productName: string;
  quantity: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  tableNumber?: number;
  clientName?: string;
  status: string;
  createdAt: string;
  items: KitchenOrderItem[];
}

@Component({
  selector: 'app-kitchen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './kitchen-dashboard.component.html',
  styleUrl: './kitchen-dashboard.component.scss',
})
export class KitchenDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  orders: KitchenOrder[] = [];
  historyOrders: KitchenOrder[] = [];
  loading = false;
  error: string | null = null;
  filterStatus: string = '';
  pollIntervalMs = 5000; // Poll a cada 5s
  pollingHandle: any;
  showHistory: boolean = false;

  statuses = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Pronto' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  ngOnInit(): void {
    this.loadOrders();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.pollingHandle = setInterval(() => {
      this.loadOrders(false);
    }, this.pollIntervalMs);
  }

  stopPolling(): void {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
    }
  }

  async loadOrders(showLoader: boolean = true): Promise<void> {
    if (showLoader) this.loading = true;
    this.error = null;
    try {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      const resp: any = await this.http
        .get(`${environment.apiUrl}/orders`, {
          params: this.filterStatus ? { status: this.filterStatus } : {},
          headers,
        })
        .toPromise();

      if (resp.success && resp.orders) {
        const allOrders = resp.orders.map((order: any) => ({
          id: order.id || order._id,
          tableNumber: order.tableNumber,
          clientName: order.clientName,
          status: order.status,
          createdAt: order.createdAt,
          items: order.items || [],
        }));

        // Separar pedidos ativos de histórico
        this.orders = allOrders.filter(
          (o: KitchenOrder) => o.status !== 'delivered' && o.status !== 'cancelled'
        );
        this.historyOrders = allOrders.filter(
          (o: KitchenOrder) => o.status === 'delivered' || o.status === 'cancelled'
        );
      } else {
        console.warn('Resposta sem success ou orders:', resp);
        this.orders = [];
        this.historyOrders = [];
      }
    } catch (err: any) {
      this.error = err.error?.message || err.message || 'Erro ao carregar pedidos';
      console.error('Erro ao carregar pedidos:', err);
      console.error('Status do erro:', err.status);
      console.error('Resposta do erro:', err.error);
    } finally {
      if (showLoader) this.loading = false;
    }
  }

  async updateStatus(order: KitchenOrder, newStatus: string): Promise<void> {
    const statusLabel = this.getStatusLabel(newStatus);
    if (!confirm(`Alterar status do pedido #${order.id.slice(-6)} para ${statusLabel}?`)) return;
    try {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      const resp: any = await this.http
        .put(
          `${environment.apiUrl}/orders/${order.id}/status`,
          {
            status: newStatus,
          },
          { headers }
        )
        .toPromise();

      if (resp.success) {
        // Atualiza localmente
        order.status = newStatus;

        // Move para histórico se foi entregue ou cancelado
        if (newStatus === 'delivered' || newStatus === 'cancelled') {
          this.orders = this.orders.filter(o => o.id !== order.id);
          this.historyOrders.unshift(order); // Adiciona no início do histórico
        }
      }
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + (err.error?.message || err.message));
      console.error('Erro ao atualizar status:', err);
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusLabel(status: string): string {
    const found = this.statuses.find(s => s.value === status);
    return found ? found.label : status;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  trackById(index: number, order: KitchenOrder) {
    return order.id;
  }
}
