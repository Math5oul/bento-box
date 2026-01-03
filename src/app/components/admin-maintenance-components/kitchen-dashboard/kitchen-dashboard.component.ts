import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth-service/auth.service';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { KitchenFiltersComponent } from './kitchen-filters/kitchen-filters.component';
import { KitchenOrderListComponent } from './kitchen-order-list/kitchen-order-list.component';
import { TableService } from '../../../services/table-service/table.service';

interface KitchenOrderItem {
  productName: string;
  quantity: number;
  notes?: string;
  status?: string;
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
}

interface KitchenOrder {
  id: string;
  tableNumber?: number;
  clientName?: string;
  status: string;
  createdAt: string;
  items: KitchenOrderItem[];
}

interface Table {
  id?: string;
  number: number;
  name?: string;
  capacity?: number;
  status?: string;
}

@Component({
  selector: 'app-kitchen-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminHeaderComponent,
    KitchenFiltersComponent,
    KitchenOrderListComponent,
  ],
  templateUrl: './kitchen-dashboard.component.html',
  styleUrl: './kitchen-dashboard.component.scss',
})
export class KitchenDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private tableService = inject(TableService);

  orders: KitchenOrder[] = [];
  historyOrders: KitchenOrder[] = [];
  allOrders: KitchenOrder[] = []; // Armazena todos os pedidos antes do filtro
  tablesMap: Map<string, Table> = new Map(); // Mapa para informações das mesas
  loading = false;
  error: string | null = null;
  filterStatus: string = 'kitchen';
  searchTerm: string = '';
  pollIntervalMs = 5000; // Poll a cada 5s
  pollingHandle: any;
  showHistory: boolean = false;

  statuses = [
    { value: '', label: 'Todos' },
    { value: 'kitchen', label: 'Na Cozinha' },
    { value: 'pending', label: 'Pendente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Pronto' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  /**
   * Retorna o próximo status válido para um pedido dado o status atual.
   * Se o status atual já for o último (delivered/cancelled) retorna null.
   */
  getNextStatus(currentStatus: string): string | null {
    // Exclui a opção "Todos" (valor vazio) ao calcular índices
    const orderStatuses = this.statuses.map(s => s.value).filter(v => v);
    const idx = orderStatuses.indexOf(currentStatus);
    if (idx === -1) return null;
    const next = orderStatuses[idx + 1];
    return next || null;
  }

  /**
   * Retorna o rótulo do próximo status (ou null se não houver)
   */
  getNextStatusLabel(currentStatus: string): string | null {
    const next = this.getNextStatus(currentStatus);
    if (!next) return null;
    const found = this.statuses.find(s => s.value === next);
    return found ? found.label : next;
  }

  ngOnInit(): void {
    this.loadTablesInfo();
    this.loadOrders();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Carrega informações das mesas para exibir nomes customizados
   */
  loadTablesInfo(): void {
    this.tableService.loadTables();
    this.tableService.tables$.subscribe({
      next: tables => {
        console.log('🏷️ Tabelas recebidas do serviço:', tables);
        this.tablesMap.clear();

        const withName: string[] = [];
        const withoutName: string[] = [];

        (tables || []).forEach(table => {
          const key = table.number.toString();
          this.tablesMap.set(key, table);

          if (table.name) {
            withName.push(`${key} = "${table.name}"`);
          } else {
            withoutName.push(key);
          }
        });

        console.log(
          '✅ Mesas COM nome customizado:',
          withName.length > 0 ? withName.join(', ') : 'nenhuma'
        );
        console.log(
          '📋 Mesas SEM nome (apenas número):',
          withoutName.length > 0 ? withoutName.join(', ') : 'nenhuma'
        );
        console.log('� Total de mesas no mapa:', this.tablesMap.size);
      },
      error: error => {
        console.error('Erro ao carregar informações das mesas:', error);
      },
    });
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

  /**
   * Aplica filtro de pesquisa nos pedidos
   */
  applySearchFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.orders = this.allOrders;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    console.log('🔍 Buscando por:', `"${searchLower}"`);
    console.log('📦 Total de pedidos:', this.allOrders.length);

    this.orders = this.allOrders.filter(order => {
      console.log('\n📋 Checando pedido:', order.id, 'Mesa:', order.tableNumber);

      // Buscar por número da mesa
      const tableNumberStr = order.tableNumber?.toString() || '';
      const tableNumberMatch = tableNumberStr.includes(searchLower);
      console.log(
        `  - tableNumberMatch: "${tableNumberStr}".includes("${searchLower}") =`,
        tableNumberMatch
      );

      // Buscar por nome customizado da mesa
      const tableInfo = this.tablesMap.get(order.tableNumber?.toString() || '');
      console.log('  - tableInfo:', tableInfo);
      const tableNameMatch = tableInfo?.name?.toLowerCase().includes(searchLower) || false;
      console.log('  - tableNameMatch:', tableNameMatch);

      // Buscar por "mesa X" ou "mX" para mesas sem nome customizado
      let tableFormatMatch = false;
      if (order.tableNumber !== undefined && !tableInfo?.name) {
        const tableNum = order.tableNumber.toString();
        const formats = [`mesa ${tableNum}`, `mesa${tableNum}`, `m${tableNum}`, `m ${tableNum}`];

        console.log('  - Testando formatos:', formats);
        console.log('  - Contra:', `"${searchLower}"`);

        // Verificar se o termo de busca contém ou é igual a algum formato
        tableFormatMatch = formats.some(format => {
          const exactMatch = searchLower === format;
          const partialMatch = searchLower.includes(format) || format.includes(searchLower);
          console.log(`    "${format}": exact=${exactMatch}, partial=${partialMatch}`);
          return exactMatch || partialMatch;
        });

        console.log('  - tableFormatMatch:', tableFormatMatch);
      }

      // Buscar por nome do cliente
      const clientMatch = order.clientName?.toLowerCase().includes(searchLower);

      // Buscar por ID do pedido
      const idMatch = order.id?.toLowerCase().includes(searchLower);

      // Buscar por itens do pedido
      const itemsMatch = order.items?.some(
        item =>
          item.productName?.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower) ||
          item.selectedVariation?.title?.toLowerCase().includes(searchLower) ||
          item.selectedSize?.name?.toLowerCase().includes(searchLower)
      );

      const result =
        tableNumberMatch ||
        tableNameMatch ||
        tableFormatMatch ||
        clientMatch ||
        idMatch ||
        itemsMatch;
      console.log('  ✅ Resultado final:', result);
      return result;
    });

    console.log('📊 Pedidos filtrados:', this.orders.length);
  }

  /**
   * Handler para mudança no termo de busca
   */
  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.applySearchFilter();
  }

  async loadOrders(showLoader: boolean = true): Promise<void> {
    if (showLoader) this.loading = true;
    this.error = null;
    try {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      let params: any = {};
      if (this.filterStatus && this.filterStatus !== 'kitchen') {
        params.status = this.filterStatus;
      }
      const resp: any = await this.http
        .get(`${environment.apiUrl}/orders`, {
          params,
          headers,
        })
        .toPromise();

      if (resp.success && resp.orders) {
        const allOrders = resp.orders.map((order: any) => ({
          id: order.id || order._id,
          tableNumber: order.tableNumber,
          clientName: order.clientName,
          // manter status do pedido por compatibilidade, mas iremos derivar de items
          status: order.status,
          createdAt: order.createdAt,
          items: (order.items || []).map((it: any) => ({
            productName: it.productName,
            quantity: it.quantity,
            notes: it.notes,
            selectedSize: it.selectedSize,
            selectedVariation: it.selectedVariation,
            status: it.status || 'pending',
          })),
        }));

        // helper para derivar status do pedido a partir dos itens
        const deriveOrderStatus = (items: KitchenOrderItem[]) => {
          if (!items || items.length === 0) return 'pending';
          const statuses = items.map(i => i.status || 'pending');
          // se todos prontos -> marcar como 'ready' (pronto para entrega), não como 'delivered'
          if (statuses.every(s => s === 'ready')) return 'ready';
          // se todos pendentes
          if (statuses.every(s => s === 'pending')) return 'pending';
          // se algum preparando -> preparing
          if (statuses.some(s => s === 'preparing')) return 'preparing';
          // default: preparing
          return 'preparing';
        };

        // Derivar status do pedido a partir dos items para consistência
        allOrders.forEach((o: any) => {
          const itemStatuses = (o.items || []).map((it: any) => it.status || 'pending');
          if (itemStatuses.length === 0) {
            o.status = o.status || 'pending';
          } else if (itemStatuses.every((s: string) => s === 'ready')) {
            o.status = 'ready';
          } else if (itemStatuses.every((s: string) => s === 'pending')) {
            o.status = 'pending';
          } else if (itemStatuses.some((s: string) => s === 'preparing')) {
            o.status = 'preparing';
          } else {
            o.status = o.status || 'preparing';
          }
        });

        // Separar pedidos ativos de histórico
        let activeOrders = allOrders.filter(
          (o: KitchenOrder) => o.status !== 'delivered' && o.status !== 'cancelled'
        );
        if (this.filterStatus === 'kitchen') {
          // Mostrar pedidos que estão na cozinha: pendentes, em preparo ou prontos para entrega
          activeOrders = activeOrders.filter(
            (o: KitchenOrder) =>
              o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
          );
        }

        // Armazenar todos os pedidos antes do filtro de pesquisa
        this.allOrders = activeOrders;

        // Aplicar filtro de pesquisa
        this.applySearchFilter();

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
    if (newStatus === 'cancelled') {
      if (!confirm(`Tem certeza que deseja cancelar o pedido #${order.id.slice(-6)}?`)) return;
    }
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

  /**
   * Atualiza o status de um item dentro de um pedido.
   * Faz uma chamada à API para persistir o novo status do item.
   * Depois reavalia o status do pedido e atualiza se necessário.
   */
  async updateItemStatus(
    order: KitchenOrder,
    item: KitchenOrderItem,
    newStatus: string
  ): Promise<void> {
    try {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      // Encontrar índice do item no array local
      const itemIndex = order.items.findIndex(i => i === item);
      if (itemIndex === -1) {
        console.warn('Item não encontrado no pedido (local)');
        return;
      }

      // Primeira: buscar o pedido completo do servidor para obter fields necessários (productId, unitPrice, totalPrice...)
      const getResp: any = await this.http
        .get(`${environment.apiUrl}/orders/${order.id}`, { headers })
        .toPromise();

      if (!getResp || !getResp.success || !getResp.order) {
        console.error('Não foi possível obter pedido completo para atualização de item', getResp);
        return;
      }

      const serverOrder = getResp.order as any;
      const serverItems = Array.isArray(serverOrder.items) ? serverOrder.items : [];

      // Atualiza o status do item no array completo
      const updatedItems = serverItems.map((it: any, idx: number) => {
        // Normalize/ensure all required fields are present and properly typed
        const normalized = {
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
        } as any;

        if (idx === itemIndex) {
          normalized.status = newStatus;
        }

        return normalized;
      });

      // Helpful debug: log the exact payload that will be sent to the server
      console.debug('PATCH /orders/' + order.id + ' payload', { items: updatedItems });

      // Envia PATCH para atualizar o pedido com os items modificados
      const patchResp: any = await this.http
        .patch(`${environment.apiUrl}/orders/${order.id}`, { items: updatedItems }, { headers })
        .toPromise();

      if (patchResp && patchResp.success) {
        // Atualiza localmente usando os dados retornados (se houver)
        const updatedOrder = patchResp.order || serverOrder;

        // Mapear itens para o formato local usado na UI
        order.items = (updatedOrder.items || []).map((it: any) => ({
          productName: it.productName,
          quantity: it.quantity,
          notes: it.notes,
          selectedSize: it.selectedSize,
          selectedVariation: it.selectedVariation,
          status: it.status || 'pending',
        }));

        // Preferir o status calculado/persistido no servidor quando disponível
        const serverStatus =
          updatedOrder && updatedOrder.status ? String(updatedOrder.status) : null;
        if (serverStatus) {
          order.status = serverStatus;
        } else {
          // Fallback: derivar localmente a partir dos itens
          const statuses = order.items.map(i => i.status || 'pending');
          if (statuses.every(s => s === 'ready')) order.status = 'ready';
          else if (statuses.every(s => s === 'pending')) order.status = 'pending';
          else if (statuses.some(s => s === 'preparing')) order.status = 'preparing';
          else order.status = order.status || 'preparing';
        }

        // Se o pedido ficou entregue ou cancelado, mover para histórico
        if (order.status === 'delivered' || order.status === 'cancelled') {
          this.orders = this.orders.filter(o => o.id !== order.id);
          this.historyOrders.unshift(order);
        }
      } else {
        console.error('Falha ao atualizar item via PATCH /orders/:orderId', patchResp);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status do item:', err);
      console.error('Detalhes do erro do backend:', err.error);
      const msg = err.error?.message || err.error?.errors || err.message || 'Erro desconhecido';
      alert('Erro ao atualizar status do item: ' + JSON.stringify(msg));
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusLabel(status: string): string {
    const found = this.statuses.find(s => s.value === status);
    return found ? found.label : status;
  }

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

  trackById(index: number, order: KitchenOrder) {
    return order.id;
  }

  /**
   * Verifica se o usuário tem permissão para gerenciar pedidos
   */
  get canManageOrders(): boolean {
    return this.authService.canManageOrders();
  }

  /**
   * Verifica se o usuário tem permissão para cancelar pedidos
   */
  get canCancelOrders(): boolean {
    // Permite cancelamento se pode gerenciar pedidos
    return this.authService.canManageOrders();
  }
}
