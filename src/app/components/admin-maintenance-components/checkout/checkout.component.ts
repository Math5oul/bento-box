import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth-service/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  clients: any[] = [];
  selectedClient: any = null;
  openOrders: any[] = [];
  selectedItemIds: Set<string> = new Set();

  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.error = '';
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>('/api/orders', { headers }).subscribe({
      next: res => {
        const orders = Array.isArray(res.orders) ? res.orders : [];
        const map = new Map();
        orders.forEach((o: any) => {
          if (!o.clientId) return;
          const id = String(o.clientId);
          if (!map.has(id)) {
            map.set(id, { clientId: id, clientName: o.clientName || 'Cliente', hasOpen: true });
          }
        });
        this.clients = Array.from(map.values());
        this.loading = false;
      },
      error: err => {
        this.error = 'Erro ao carregar clientes';
        this.loading = false;
      },
    });
  }

  selectClient(client: any) {
    this.selectedClient = client;
    this.loadOpenOrdersForClient(client.clientId);
  }

  loadOpenOrdersForClient(clientId: string) {
    this.loading = true;
    this.error = '';
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>('/api/orders', { headers }).subscribe({
      next: res => {
        const orders = Array.isArray(res.orders) ? res.orders : [];
        this.openOrders = orders.filter(
          (o: any) =>
            String(o.clientId) === String(clientId) &&
            o.status !== 'done' &&
            o.status !== 'cancelled'
        );
        this.loading = false;
      },
      error: err => {
        this.error = 'Erro ao carregar pedidos do cliente';
        this.loading = false;
      },
    });
  }

  toggleSelectOrderItem(orderId: string, itemId: string) {
    if (this.selectedItemIds.has(itemId)) this.selectedItemIds.delete(itemId);
    else this.selectedItemIds.add(itemId);
  }

  toggleSelectAllItemsForOrder(order: any) {
    const itemIds: string[] = (order.items || []).map((it: any) =>
      String(it._id || it.id || `${order.id}-${it.productId || it.productName}`)
    );
    const allSelected = itemIds.every((id: string) => this.selectedItemIds.has(id));
    if (allSelected) {
      itemIds.forEach((id: string) => this.selectedItemIds.delete(id));
    } else {
      itemIds.forEach((id: string) => this.selectedItemIds.add(id));
    }
  }

  startPayment() {
    const ids = Array.from(this.selectedItemIds);
    if (ids.length === 0) {
      alert('Selecione pelo menos um item para pagamento');
      return;
    }

    const selectedItems: any[] = [];
    this.openOrders.forEach(o => {
      (o.items || []).forEach((it: any) => {
        const id = it._id || it.id || `${o.id}-${it.productId || it.productName}`;
        if (this.selectedItemIds.has(id)) {
          selectedItems.push({
            orderId: o.id,
            itemId: id,
            productName: it.productName,
            amount: it.totalPrice,
          });
        }
      });
    });

    const total = selectedItems.reduce((s, it) => s + (it.amount || 0), 0);
    alert(`Iniciar pagamento para ${selectedItems.length} item(s). Total: R$ ${total.toFixed(2)}`);
  }
}
