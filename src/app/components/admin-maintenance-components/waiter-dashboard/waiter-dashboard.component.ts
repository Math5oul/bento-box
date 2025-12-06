import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { interval, Subscription } from 'rxjs';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { NewOrderModalComponent } from '../new-order-modal/new-order-modal.component';
import { EditTableModalComponent } from '../../shared/edit-table-modal/edit-table-modal.component';
import { Table } from '../../../interfaces/table.interface';
import { TableService } from '../../../services/table-service/table.service';

interface WaiterOrder {
  id: string;
  tableNumber: string;
  clientName: string;
  isClientAnonymous?: boolean;
  status: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
    selectedSize?: {
      name: string;
      abbreviation: string;
      price: number;
    };
    selectedVariation?: {
      title: string;
      description?: string;
      image?: string;
      price: number;
    };
    status?: string;
  }[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminHeaderComponent,
    NewOrderModalComponent,
    EditTableModalComponent,
  ],
  templateUrl: './waiter-dashboard.component.html',
  styleUrls: ['./waiter-dashboard.component.scss'],
})
export class WaiterDashboardComponent implements OnInit, OnDestroy {
  productOptions: {
    sizes?: { name: string; abbreviation: string; price: number }[];
    variations?: { title: string; description?: string; image?: string; price: number }[];
    basePrice: number;
  }[] = [];
  orders: WaiterOrder[] = [];
  filteredOrders: WaiterOrder[] = [];
  historyOrders: WaiterOrder[] = [];

  loading = false;
  error = '';
  showHistory = false;

  // Modal de novo pedido
  showNewOrderModal = false;

  // Modal de edição de pedido
  showEditModal = false;
  editingOrder: WaiterOrder | null = null;

  // Modal de edição de mesa
  showEditTableModal = false;
  selectedTableForEdit: Table | null = null;
  // Edição inline do nome do cliente
  editingNameOrderId: string | null = null;
  editingNameValue = '';
  editingItems: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
    selectedSize?: {
      name: string;
      abbreviation: string;
      price: number;
    };
    selectedVariation?: {
      title: string;
      description?: string;
      image?: string;
      price: number;
    };
    status?: string;
  }[] = [];

  // Filtros
  // Padrão: '' (Todos) — show all items by default so pending tables appear
  filterStatus = '';
  filterTable = 'all';
  searchTerm = '';
  activeTab: 'deliver' | 'tables' = 'deliver';
  showReadyOnly = true;

  // Array de itens prontos com referência ao pedido
  readyViewItems: Array<{
    orderId: string;
    tableNumber: string;
    clientName?: string;
    item: any;
    itemIndex: number;
    order?: WaiterOrder;
  }> = [];

  // Listas de opções para filtros (alinhado com kitchen)
  statuses = [
    { value: '', label: 'Todos' },
    { value: 'kitchen', label: 'Na Cozinha' },
    { value: 'pending', label: 'Pendente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Pronto' },
    { value: 'delivered', label: 'Entregue' },
  ];

  tables: string[] = [];
  tablesMap: Map<string, Table> = new Map(); // Mapa para informações completas das mesas
  allTables: Table[] = []; // Array com todas as mesas

  // Polling automático
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 10000; // 10 segundos

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private tableService: TableService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadTablesInfo();
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
        // Separar pedidos ativos (todos que não forem history) de histórico (delivered, cancelled)
        const historyStatuses = ['delivered', 'cancelled'];

        // Keep all non-history orders as active; we'll filter by item statuses in applyFilters
        this.orders = response.orders.filter(o => !historyStatuses.includes(o.status));
        this.historyOrders = response.orders.filter(o => historyStatuses.includes(o.status));

        // Extrair lista única de mesas
        const uniqueTables = [...new Set(response.orders.map(o => o.tableNumber))];
        this.tables = uniqueTables.sort((a, b) => {
          const numA = parseInt(a) || 0;
          const numB = parseInt(b) || 0;
          return numA - numB;
        });

        this.applyFilters();
        // compute ready-items view for waiter quick access
        this.computeReadyView();
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
   * Computa lista de itens com status 'ready' para a vista rápida do garçom
   */
  computeReadyView() {
    const items: any[] = [];
    (this.orders || []).forEach(order => {
      (order.items || []).forEach((it, idx) => {
        const status = it.status || 'pending';
        if (status === 'ready') {
          items.push({
            orderId: order.id,
            tableNumber: order.tableNumber,
            clientName: order.clientName,
            item: it,
            itemIndex: idx,
            order,
          });
        }
      });
    });

    // Keep most-recent first
    this.readyViewItems = items.sort((a, b) => {
      const ta = new Date(a.order?.createdAt || 0).getTime();
      const tb = new Date(b.order?.createdAt || 0).getTime();
      return tb - ta;
    });
  }

  /**
   * Getter rápido para contar itens prontos
   */
  get readyItemsCount(): number {
    return this.readyViewItems.length;
  }

  /** Toggle da visão de itens prontos */
  toggleReadyView() {
    this.showReadyOnly = !this.showReadyOnly;
    this.activeTab = this.showReadyOnly ? 'deliver' : 'tables';
  }

  /**
   * Entrega um único item (usado na visão de itens prontos)
   */
  deliverSingleItem(orderId: string, item: any) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      console.warn('Pedido não encontrado para deliverSingleItem', orderId);
      return;
    }

    // encontra o item no pedido (por referência ou por matching de produto/nome)
    const serverItem = order.items.find(
      i => i === item || (i.productName === item.productName && i.quantity === item.quantity)
    );
    if (!serverItem) {
      // fallback: passa o objeto item recebido
      this.updateItemStatus(order, item, 'delivered');
    } else {
      this.updateItemStatus(order, serverItem, 'delivered');
    }
  }

  /**
   * Aplica filtros aos pedidos
   */
  applyFilters() {
    let filtered = [...this.orders];

    // Filtro por status — agora baseado no status dos ITENS do pedido
    // '' (empty) means 'Todos' (aligned with kitchen dashboard)
    if (this.filterStatus) {
      if (this.filterStatus === 'kitchen') {
        // 'Na Cozinha' -> se qualquer item estiver pendente, em preparo ou pronto
        filtered = filtered.filter(o =>
          (o.items || []).some(i => {
            const s = i.status || 'pending';
            return s === 'pending' || s === 'preparing' || s === 'ready';
          })
        );
      } else {
        // Exibe pedido se qualquer item tiver o status selecionado (ex: 'ready')
        filtered = filtered.filter(o =>
          (o.items || []).some(i => (i.status || 'pending') === this.filterStatus)
        );
      }
    }

    // Filtro por mesa
    if (this.filterTable !== 'all') {
      filtered = filtered.filter(
        o => String(o.tableNumber).trim() === String(this.filterTable).trim()
      );
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
    this.updateStatus(order, 'delivered');
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
    this.editingItems = JSON.parse(JSON.stringify(order.items));
    this.productOptions = [];

    // Para cada item, busca as opções do produto
    const requests = this.editingItems.map((item, index) => {
      if (!item.productId) {
        return Promise.resolve({
          success: true,
          data: {
            price: item.unitPrice,
            sizes: [],
            variations: [],
          },
        });
      }

      return this.http
        .get<{ success: boolean; data: any }>(`/api/products/${item.productId}`)
        .toPromise()
        .catch(error => {
          console.error(`Erro ao carregar produto ${item.productId}:`, error);
          return {
            success: false,
            data: {
              price: item.unitPrice,
              sizes: [],
              variations: [],
            },
          };
        });
    });

    Promise.all(requests).then(results => {
      this.productOptions = results.map((r, index) => {
        const productData = r?.data || {};
        const currentItem = this.editingItems[index];

        return {
          sizes: productData.sizes || [],
          variations: productData.variations || [],
          basePrice:
            typeof productData.price === 'number' ? productData.price : currentItem.unitPrice,
        };
      });

      // AGORA FAZEMOS O MATCH DOS VALORES SELECIONADOS COM AS OPÇÕES DISPONÍVEIS
      this.editingItems.forEach((item, index) => {
        const options = this.productOptions[index];

        // Match do tamanho selecionado
        if (item.selectedSize && options.sizes!.length > 0) {
          const matchedSize = options.sizes!.find(
            size => size.abbreviation === item.selectedSize?.abbreviation
          );
          item.selectedSize = matchedSize || undefined;
        } else {
          item.selectedSize = undefined;
        }

        // Match da variação selecionada
        if (item.selectedVariation && options.variations!.length > 0) {
          const matchedVariation = options.variations!.find(
            variation => variation.title === item.selectedVariation?.title
          );
          item.selectedVariation = matchedVariation || undefined;
        } else {
          item.selectedVariation = undefined;
        }

        // Recalcula o preço após o match
        this.onSizeOrVariationChange(index);
      });

      this.showEditModal = true;
    });
  }

  /**
   * Atualiza o status de um item dentro de um pedido.
   * Faz uma chamada à API para persistir o novo status do item.
   * Depois reavalia o status do pedido e atualiza se necessário.
   */
  async updateItemStatus(order: WaiterOrder, item: any, newStatus: string) {
    try {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      let itemIndex = order.items.findIndex(i => i === item);

      // Buscar o pedido completo no servidor para garantir campos (productId, preços, etc.)
      const getResp: any = await this.http.get(`/api/orders/${order.id}`, { headers }).toPromise();
      if (!getResp || !getResp.success || !getResp.order) {
        console.error('Não foi possível obter pedido completo para atualização de item', getResp);
        return;
      }

      const serverOrder = getResp.order as any;
      const serverItems = Array.isArray(serverOrder.items) ? serverOrder.items : [];

      let serverItemIndex = -1;
      if (itemIndex === -1) {
        serverItemIndex = serverItems.findIndex((si: any) => {
          if (item.productId && si.productId) {
            return (
              String(si.productId) === String(item.productId) &&
              Number(si.quantity) === Number(item.quantity)
            );
          }
          return (
            si.productName === item.productName && Number(si.quantity) === Number(item.quantity)
          );
        });

        if (serverItemIndex === -1) {
          console.warn(
            'Item não encontrado localmente nem no servidor para o pedido',
            order.id,
            item
          );
        } else {
          // use serverItemIndex as the target when applying the status
          itemIndex = serverItemIndex;
        }
      }

      const updatedItems = serverItems.map((it: any, idx: number) => {
        const normalized: any = {
          productId: it.productId ? String(it.productId) : undefined,
          productName: it.productName,
          productImage: it.productImage,
          quantity: typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0,
          unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : Number(it.unitPrice) || 0,
          totalPrice:
            typeof it.totalPrice === 'number' ? it.totalPrice : Number(it.totalPrice) || 0,
          notes: it.notes,
          selectedSize: it.selectedSize,
          selectedVariation: it.selectedVariation,
          status: it.status || 'pending',
          paidQuantity:
            typeof it.paidQuantity === 'number' ? it.paidQuantity : Number(it.paidQuantity) || 0,
        };

        if (idx === itemIndex) normalized.status = newStatus;

        return normalized;
      });

      const itemStatuses = updatedItems.map((it: any) => it.status || 'pending');
      let aggregatedStatus = order.status || 'preparing';
      if (itemStatuses.every((s: string) => s === 'delivered')) aggregatedStatus = 'delivered';
      else if (itemStatuses.every((s: string) => s === 'ready')) aggregatedStatus = 'ready';
      else if (itemStatuses.every((s: string) => s === 'pending')) aggregatedStatus = 'pending';
      else if (itemStatuses.some((s: string) => s === 'preparing')) aggregatedStatus = 'preparing';

      // Envia PATCH para atualizar o pedido com os items modificados e o status agregado
      const patchResp: any = await this.http
        .patch(
          `/api/orders/${order.id}`,
          { items: updatedItems, status: aggregatedStatus },
          { headers }
        )
        .toPromise();

      if (patchResp && patchResp.success) {
        const updatedOrder = patchResp.order || serverOrder;

        order.items = (updatedOrder.items || []).map((it: any) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          notes: it.notes,
          selectedSize: it.selectedSize,
          selectedVariation: it.selectedVariation,
          status: it.status || 'pending',
        }));

        const serverStatus =
          updatedOrder && updatedOrder.status ? String(updatedOrder.status) : null;
        if (serverStatus) {
          order.status = serverStatus;
        } else {
          const statuses = order.items.map(i => i.status || 'pending');
          if (statuses.every(s => s === 'delivered')) order.status = 'delivered';
          else if (statuses.every(s => s === 'ready')) order.status = 'ready';
          else if (statuses.every(s => s === 'pending')) order.status = 'pending';
          else if (statuses.some(s => s === 'preparing')) order.status = 'preparing';
          else order.status = order.status || 'preparing';
        }

        // Move to history if order is now delivered or cancelled
        if (order.status === 'delivered' || order.status === 'cancelled') {
          this.orders = this.orders.filter(o => o.id !== order.id);
          this.historyOrders.unshift(order);
        }
        this.applyFilters();
        this.computeReadyView();
      } else {
        console.error('Falha ao atualizar item via PATCH /orders/:orderId', patchResp);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status do item:', err);
      const msg = err.error?.message || err.error?.errors || err.message || 'Erro desconhecido';
      alert('Erro ao atualizar status do item: ' + JSON.stringify(msg));
    }
  }

  /**
   * Atualiza preço do item ao mudar size/variation
   */
  onSizeOrVariationChange(index: number) {
    const item = this.editingItems[index];
    const productOption = this.productOptions[index];

    if (!productOption) return;

    let unitPrice = 0;

    // Se tem tamanho selecionado, usa o preço do tamanho (que já é o preço base)
    if (item.selectedSize) {
      unitPrice = item.selectedSize.price;
    } else {
      // Se não tem tamanho, usa o preço base do produto
      unitPrice = productOption.basePrice;
    }

    if (item.selectedVariation) {
      unitPrice += item.selectedVariation.price;
    }

    // Atualiza preço unitário e total
    item.unitPrice = unitPrice;
    item.totalPrice = unitPrice * item.quantity;
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
        selectedSize: item.selectedSize,
        selectedVariation: item.selectedVariation,
        status: item.status || 'pending',
      })),
      totalAmount: this.getEditingTotal(),
    };

    const editingStatuses = updatedOrder.items.map((it: any) => it.status || 'pending');
    let editedAggregatedStatus = this.editingOrder.status || 'preparing';
    if (editingStatuses.every((s: string) => s === 'delivered'))
      editedAggregatedStatus = 'delivered';
    else if (editingStatuses.every((s: string) => s === 'ready')) editedAggregatedStatus = 'ready';
    else if (editingStatuses.every((s: string) => s === 'pending'))
      editedAggregatedStatus = 'pending';
    else if (editingStatuses.some((s: string) => s === 'preparing'))
      editedAggregatedStatus = 'preparing';

    this.http
      .patch<{
        message: string;
        order: WaiterOrder;
      }>(
        `/api/orders/${this.editingOrder.id}`,
        { ...updatedOrder, status: editedAggregatedStatus },
        { headers }
      )
      .subscribe({
        next: response => {
          this.closeEditModal();
          this.loadOrders(true);
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

  /** trackBy for ready items list */
  trackByReady(index: number, item: any) {
    return `${item.orderId}-${index}-${item.item?.productName}`;
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

  /**
   * Verifica se o usuário tem permissão para gerenciar pedidos
   */
  get canManageOrders(): boolean {
    return this.authService.canManageOrders();
  }

  /**
   * Verifica se o usuário pode entregar pedidos
   */
  get canDeliverOrders(): boolean {
    return this.authService.canManageOrders();
  }

  /**
   * Verifica se o usuário pode cancelar pedidos
   */
  get canCancelOrders(): boolean {
    return this.authService.canManageOrders();
  }

  /**
   * Carrega informações das mesas para exibir nomes
   */
  loadTablesInfo() {
    this.tableService.loadTables();
    this.tableService.tables$.subscribe({
      next: tables => {
        this.allTables = tables || [];
        // Atualiza o mapa de mesas
        this.tablesMap.clear();
        this.allTables.forEach(table => {
          this.tablesMap.set(table.number.toString(), table);
        });
      },
      error: error => {
        console.error('Erro ao carregar informações das mesas:', error);
      },
    });
  }

  /**
   * Retorna o nome formatado da mesa (nome se houver, senão "Mesa X")
   */
  getTableDisplayName(tableNumber: string | number): string {
    // Garante que sempre comparamos como string
    const tableNumberStr = String(tableNumber);
    const table = this.tablesMap.get(tableNumberStr);

    if (table?.name) {
      return table.name;
    }
    return `Mesa ${tableNumberStr}`;
  }

  /**
   * Abre modal para editar mesa a partir do número
   */
  openEditTableModal(tableNumber: string | number) {
    // Garante que o número é string para buscar no Map
    const tableNumberStr = String(tableNumber);

    const table = this.tablesMap.get(tableNumberStr);

    if (table) {
      this.selectedTableForEdit = table;
      this.showEditTableModal = true;
    } else {
      console.warn('🔧 Mesa não encontrada no Map para chave:', tableNumberStr);
      alert('Mesa não encontrada');
    }
  }

  /**
   * Fecha modal de edição de mesa
   */
  closeEditTableModal() {
    this.showEditTableModal = false;
    this.selectedTableForEdit = null;
  }

  /**
   * Salva alterações na mesa
   */
  async handleSaveTable(data: { id: string; number: number; name?: string; capacity: number }) {
    try {
      await this.tableService.updateTable(data.id, {
        number: data.number,
        name: data.name,
        capacity: data.capacity,
      });
      this.closeEditTableModal();
      alert('Mesa atualizada com sucesso!');
      // Recarrega informações das mesas e pedidos
      this.loadTablesInfo();
      this.loadOrders(true);
    } catch (error: any) {
      console.error('Erro ao atualizar mesa:', error);
      alert(
        'Erro ao atualizar mesa: ' + (error.error?.message || 'Verifique se o número já existe.')
      );
    }
  }
}
