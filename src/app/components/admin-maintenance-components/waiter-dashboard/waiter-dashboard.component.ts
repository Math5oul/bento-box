import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { interval, Subscription } from 'rxjs';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { NewOrderModalComponent } from '../new-order-modal/new-order-modal.component';
// ...existing imports...

interface WaiterOrder {
  id: string;
  tableNumber: string;
  clientName: string;
  isClientAnonymous?: boolean;
  status: string;
  items: {
    productId?: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminHeaderComponent, NewOrderModalComponent],
  templateUrl: './waiter-dashboard.component.html',
  styleUrls: ['./waiter-dashboard.component.scss'],
})
export class WaiterDashboardComponent implements OnInit, OnDestroy {
  orders: WaiterOrder[] = [];
  filteredOrders: WaiterOrder[] = [];
  historyOrders: WaiterOrder[] = [];

  loading = false;
  error = '';
  showHistory = false;

  // Modal de novo pedido
  showNewOrderModal = false;

  // Modal de edição
  showEditModal = false;
  editingOrder: WaiterOrder | null = null;
  // Edição inline do nome do cliente
  editingNameOrderId: string | null = null;
  editingNameValue = '';
  editingItems: {
    productId?: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }[] = [];

  // Filtros
  filterStatus = 'all';
  filterTable = 'all';
  searchTerm = '';

  // Listas de opções para filtros
  statuses = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Pronto' },
  ];

  tables: string[] = [];

  // Polling automático
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 10000; // 10 segundos

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  /**
   * Inicia polling automático
   */
  private startPolling() {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.loadOrders(true); // true = silencioso (sem loading)
    });
  }

  /**
   * Para o polling
   */
  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Carrega pedidos do backend
   */
  loadOrders(silent = false) {
    if (!silent) {
      this.loading = true;
    }
    this.error = '';

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get<{ orders: WaiterOrder[] }>('/api/orders', { headers }).subscribe({
      next: response => {
        // Separar pedidos ativos (pending, preparing, ready) de histórico (delivered, cancelled)
        const activeStatuses = ['pending', 'preparing', 'ready'];
        const historyStatuses = ['delivered', 'cancelled'];

        this.orders = response.orders.filter(o => activeStatuses.includes(o.status));
        this.historyOrders = response.orders.filter(o => historyStatuses.includes(o.status));

        // Extrair lista única de mesas
        const uniqueTables = [...new Set(response.orders.map(o => o.tableNumber))];
        this.tables = uniqueTables.sort((a, b) => {
          const numA = parseInt(a) || 0;
          const numB = parseInt(b) || 0;
          return numA - numB;
        });

        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        console.error('Erro ao carregar pedidos:', err);
        this.error = err.error?.message || 'Erro ao carregar pedidos';
        this.loading = false;
      },
    });
  }

  /**
   * Aplica filtros aos pedidos
   */
  applyFilters() {
    let filtered = [...this.orders];

    // Filtro por status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === this.filterStatus);
    }

    // Filtro por mesa
    if (this.filterTable !== 'all') {
      filtered = filtered.filter(o => o.tableNumber === this.filterTable);
    }

    // Busca por texto (cliente ou mesa) — multi-token AND: cada token deve casar com algum campo
    if (this.searchTerm.trim()) {
      const raw = this.searchTerm.trim();
      // separa por espaços, ignora tokens vazios
      const tokens = raw
        .split(/\s+/)
        .map(t => t.toLowerCase())
        .filter(Boolean);

      filtered = filtered.filter(o => {
        // valores normalizados para comparação
        const name = (o.clientName || '').toLowerCase();
        const table = String(o.tableNumber || '').toLowerCase();

        // para cada token, verifica se casa com name ou table
        return tokens.every(token => {
          // se token for 'mesa' seguido de número como 'mesa 3' ou 'm3' (tratado pelo tokenização),
          // permitimos que 'mesa' combine com o campo table quando seguido por número no próximo token.
          if (/^mesa$/.test(token)) {
            return true; // 'mesa' por si só não filtra, apenas permite composição como 'mesa 3'
          }

          // se token contém apenas dígitos, compara igualdade numérica com table
          if (/^\d+$/.test(token)) {
            return table === token;
          }

          // match textual (inclui casos como 'mesa3' ou 'm3' se enviados juntos)
          return name.includes(token) || table.includes(token) || table === token.replace(/^m/, '');
        });
      });
    }

    this.filteredOrders = filtered;
  }

  /**
   * Atualiza status do pedido
   */
  updateStatus(order: WaiterOrder, newStatus: string) {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .patch<{
        message: string;
        order: WaiterOrder;
      }>(`/api/orders/${order.id}/status`, { status: newStatus }, { headers })
      .subscribe({
        next: response => {
          console.log('✅ Status atualizado:', response.message);
          this.loadOrders(true); // Recarrega silenciosamente
        },
        error: err => {
          console.error('Erro ao atualizar status:', err);
          alert(err.error?.message || 'Erro ao atualizar status');
        },
      });
  }

  /**
   * Retorna classe CSS baseada no status
   */
  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  /**
   * Retorna label amigável do status
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Calcula tempo decorrido desde criação
   */
  getElapsedTime(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Verifica se pode marcar como entregue
   */
  canDeliver(order: WaiterOrder): boolean {
    return order.status === 'ready';
  }

  /**
   * Marca pedido como entregue
   */
  deliverOrder(order: WaiterOrder) {
    if (confirm(`Confirmar entrega do pedido da Mesa ${order.tableNumber}?`)) {
      this.updateStatus(order, 'delivered');
    }
  }

  /**
   * Cancela pedido
   */
  cancelOrder(order: WaiterOrder) {
    const reason = prompt(`Cancelar pedido da Mesa ${order.tableNumber}?\nMotivo (opcional):`);
    if (reason !== null) {
      // null = cancelou o prompt, string vazia = OK sem motivo
      this.updateStatus(order, 'cancelled');
    }
  }

  /**
   * Verifica se pode editar pedido
   */
  canEdit(order: WaiterOrder): boolean {
    // Não pode editar pedidos já entregues ou cancelados
    return !['delivered', 'cancelled'].includes(order.status);
  }

  /**
   * Abre modal de edição
   */
  openEditModal(order: WaiterOrder) {
    if (!this.canEdit(order)) {
      alert('Não é possível editar pedidos já entregues ou cancelados.');
      return;
    }

    this.editingOrder = order;
    // Cria cópia dos itens para edição
    this.editingItems = JSON.parse(JSON.stringify(order.items));
    this.showEditModal = true;
  }

  /**
   * Fecha modal de edição
   */
  closeEditModal() {
    this.showEditModal = false;
    this.editingOrder = null;
    this.editingItems = [];
  }

  /**
   * Atualiza quantidade de um item
   */
  updateItemQuantity(index: number, newQuantity: number) {
    if (newQuantity < 1) {
      return;
    }
    this.editingItems[index].quantity = newQuantity;
    this.editingItems[index].totalPrice = this.editingItems[index].unitPrice * newQuantity;
  }

  /**
   * Remove item do pedido
   */
  removeItem(index: number) {
    if (this.editingItems.length === 1) {
      alert('O pedido deve ter pelo menos 1 item. Para remover todos, cancele o pedido.');
      return;
    }

    if (confirm(`Remover "${this.editingItems[index].productName}" do pedido?`)) {
      this.editingItems.splice(index, 1);
    }
  }

  /**
   * Calcula total do pedido editado
   */
  getEditingTotal(): number {
    return this.editingItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  /**
   * Salva alterações do pedido
   */
  saveOrderChanges() {
    if (!this.editingOrder || this.editingItems.length === 0) {
      return;
    }

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const updatedOrder = {
      items: this.editingItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      })),
      totalAmount: this.getEditingTotal(),
    };

    this.http
      .patch<{
        message: string;
        order: WaiterOrder;
      }>(`/api/orders/${this.editingOrder.id}`, updatedOrder, { headers })
      .subscribe({
        next: response => {
          console.log('✅ Pedido atualizado:', response.message);
          this.closeEditModal();
          this.loadOrders(true); // Recarrega silenciosamente
        },
        error: err => {
          console.error('Erro ao atualizar pedido:', err);
          alert(err.error?.message || 'Erro ao atualizar pedido');
        },
      });
  }

  /**
   * Renomeia cliente anônimo associado ao pedido (prompt + chamada ao backend)
   */
  async renameAnonymousClient(order: WaiterOrder) {
    // mantém compatibilidade com botão existente (prompt)
    const currentName = order.clientName || 'Cliente';
    const newName = prompt(`Novo nome para o cliente (atual: ${currentName}):`, currentName);
    if (newName === null) return; // cancelado
    const trimmed = String(newName).trim();
    if (!trimmed) {
      alert('Nome inválido');
      return;
    }

    await this.doRename(order.id, trimmed);
  }

  // inicia edição inline (clicar no ícone)
  startEditName(order: WaiterOrder) {
    if (!this.canEdit(order)) return;
    this.editingNameOrderId = order.id;
    this.editingNameValue = order.clientName || '';
  }

  cancelEditName() {
    this.editingNameOrderId = null;
    this.editingNameValue = '';
  }

  async saveEditName(order: WaiterOrder) {
    const trimmed = String(this.editingNameValue || '').trim();
    if (!trimmed) {
      alert('Nome inválido');
      return;
    }
    await this.doRename(order.id, trimmed);
    this.cancelEditName();
  }

  // método reutilizável para renomear via API
  private async doRename(orderId: string, newName: string) {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    try {
      await this.http
        .patch(`/api/orders/${orderId}/rename-client`, { name: newName }, { headers })
        .toPromise();
      this.loadOrders(true);
    } catch (err: any) {
      console.error('Erro ao renomear cliente:', err);
      alert(err?.error?.message || 'Erro ao renomear cliente');
    }
  }

  /**
   * TrackBy para performance
   */
  trackById(index: number, order: WaiterOrder) {
    return order.id;
  }

  /**
   * Navegação para criar novo pedido
   */
  createNewOrder() {
    this.showNewOrderModal = true;
  }

  /**
   * Fecha o modal de novo pedido
   */
  handleCloseNewOrderModal() {
    this.showNewOrderModal = false;
  }

  /**
   * Manipula o evento de pedido criado
   */
  handleOrderCreated() {
    this.showNewOrderModal = false;
    this.loadOrders(true);
  }
}
