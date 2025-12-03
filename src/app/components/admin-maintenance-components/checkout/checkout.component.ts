import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../../services/bill.service';
import { OrderService } from '../../../services/order-service/order.service';
import { TableService } from '../../../services/table-service/table.service';
import {
  BillItem,
  CreateBillDTO,
  PaymentMethod,
  PaymentMethodLabels,
  DiscountType,
  Bill,
  BillStatus,
} from '../../../interfaces/bill.interface';
import { Order, OrderStatus } from '../../../interfaces/order.interface';
import { Table } from '../../../interfaces/table.interface';

interface CheckoutItem extends BillItem {
  selected: boolean;
  editing: boolean;
  clientName?: string;
  clientId?: string;
  sessionToken?: string;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  items: CheckoutItem[];
  allSelected: boolean;
  orderCount?: number; // Quantidade de orders diferentes
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  private billService = inject(BillService);
  private orderService = inject(OrderService);
  private tableService = inject(TableService);

  // Dados
  tables: Table[] = [];
  selectedTable: Table | null = null;
  orders: Order[] = [];
  items: CheckoutItem[] = [];
  clientGroups: ClientGroup[] = [];
  billHistory: Bill[] = [];

  // UI
  loading = false;
  step: 'select-table' | 'select-items' | 'payment' = 'select-table';

  // Modais
  showSplitModal = false;
  showDiscountModal = false;
  showHistoryModal = false;

  // Split
  splitItem: CheckoutItem | null = null;
  splitQuantity = 2;

  // Desconto
  discountItem: CheckoutItem | null = null;
  discountType: DiscountType = DiscountType.PERCENTAGE;
  discountValue = 0;
  discountDescription = '';

  // Pagamento
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
  paymentNotes = '';

  // Para template
  PaymentMethodLabels = PaymentMethodLabels;
  paymentMethods = Object.values(PaymentMethod);
  DiscountType = DiscountType;

  ngOnInit() {
    this.loadTables();
  }

  async loadTables() {
    this.loading = true;
    try {
      await this.tableService.loadTables();
      this.tableService.tables$.subscribe(tables => {
        this.tables = tables;
      });
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      alert('❌ Erro ao carregar mesas');
    } finally {
      this.loading = false;
    }
  }

  async selectTable(table: Table) {
    this.selectedTable = table;
    this.loading = true;
    try {
      const response = await this.orderService.getAllOrders({ tableId: table.id }).toPromise();
      const allOrders = response?.orders || [];

      // Aceita pedidos em qualquer status EXCETO CANCELLED (pedidos entregues ainda precisam ser pagos)
      // O tableId pode vir como string ou como objeto populado {_id, number}
      this.orders = allOrders.filter((order: Order) => {
        const orderTableId =
          typeof order.tableId === 'object'
            ? (order.tableId as any)._id || (order.tableId as any).id
            : order.tableId;
        return String(orderTableId) === String(table.id) && order.status !== OrderStatus.CANCELLED;
      });

      if (this.orders.length === 0) {
        alert('⚠️ Esta mesa não possui pedidos disponíveis para pagamento');
        this.selectedTable = null;
        return;
      }

      this.items = [];
      this.orders.forEach(order => {
        // Extrai o clientId corretamente (pode vir como string ou como objeto populado)
        let clientId: string | undefined;
        if (order.clientId) {
          if (typeof order.clientId === 'string') {
            clientId = order.clientId;
          } else if (typeof order.clientId === 'object') {
            // ClientId foi populado pelo backend, pega o _id ou id
            clientId = (order.clientId as any)._id || (order.clientId as any).id;
          }
        }

        order.items.forEach((orderItem, index) => {
          this.items.push({
            selected: false,
            editing: false,
            orderId: order.id,
            orderItemId: `${order.id}-${index}`,
            productId: String(orderItem.productId || ''),
            productName: orderItem.productName,
            quantity: orderItem.quantity,
            originalQuantity: orderItem.quantity,
            unitPrice: orderItem.unitPrice,
            subtotal: orderItem.quantity * orderItem.unitPrice,
            finalPrice: orderItem.quantity * orderItem.unitPrice,
            isSplit: false,
            clientName: order.clientName,
            clientId: clientId, // Usa o ID extraído corretamente
            sessionToken: order.sessionToken,
          });
        });
      });
      this.groupItemsByClient();
      this.step = 'select-items';
      this.loadBillHistory();
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      alert('❌ Erro ao carregar pedidos');
      this.selectedTable = null;
    } finally {
      this.loading = false;
    }
  }

  async loadBillHistory() {
    if (!this.selectedTable) return;
    try {
      const response = await this.billService
        .getBills({ tableId: this.selectedTable.id })
        .toPromise();
      this.billHistory = response?.data || [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }

  groupItemsByClient() {
    const groupMap = new Map<string, ClientGroup>();

    // Agrupa itens por cliente (registrado ou anônimo)
    this.items.forEach(item => {
      // Determina a chave única do cliente:
      // 1. Se tem clientId (registrado): usa o clientId
      // 2. Se não tem clientId mas tem sessionToken (anônimo): usa o sessionToken
      // 3. Se não tem nenhum: cada order é um "cliente" diferente
      let clientKey: string;
      let clientName: string;

      if (item.clientId) {
        // Cliente registrado - todos os orders desse clientId serão agrupados
        const clientIdStr = String(item.clientId);
        clientKey = `registered-${clientIdStr}`;
        clientName = item.clientName || 'Cliente';
      } else if (item.sessionToken) {
        // Cliente anônimo com sessão - todos os orders dessa sessão serão agrupados
        clientKey = `session-${item.sessionToken}`;
        clientName = item.clientName || 'Cliente Anônimo';
      } else {
        // Sem identificação - cada order é tratado separadamente
        clientKey = `order-${item.orderId}`;
        clientName = item.clientName || 'Cliente Anônimo';
      }

      if (!groupMap.has(clientKey)) {
        groupMap.set(clientKey, {
          clientId: clientKey,
          clientName: clientName,
          items: [],
          allSelected: false,
          orderCount: 0,
        });
      }

      groupMap.get(clientKey)!.items.push(item);
    });

    // Calcula quantos orders diferentes cada grupo tem
    groupMap.forEach(group => {
      const uniqueOrderIds = new Set(group.items.map(item => item.orderId));
      group.orderCount = uniqueOrderIds.size;
    });

    // Ordena grupos: primeiro clientes registrados, depois anônimos com sessão, depois sem identificação
    this.clientGroups = Array.from(groupMap.values()).sort((a, b) => {
      const aIsRegistered = a.clientId.startsWith('registered-');
      const bIsRegistered = b.clientId.startsWith('registered-');
      const aHasSession = a.clientId.startsWith('session-');
      const bHasSession = b.clientId.startsWith('session-');

      if (aIsRegistered && !bIsRegistered) return -1;
      if (!aIsRegistered && bIsRegistered) return 1;
      if (aHasSession && !bHasSession) return -1;
      if (!aHasSession && bHasSession) return 1;
      return a.clientName.localeCompare(b.clientName);
    });

    this.updateGroupSelectionStates();
  }

  updateGroupSelectionStates() {
    this.clientGroups.forEach(group => {
      group.allSelected = group.items.length > 0 && group.items.every(item => item.selected);
    });
  }

  toggleItemSelection(item: CheckoutItem) {
    item.selected = !item.selected;
    this.updateGroupSelectionStates();
  }

  toggleClientGroup(group: ClientGroup) {
    const newState = !group.allSelected;
    group.items.forEach(item => (item.selected = newState));
    group.allSelected = newState;
  }

  selectAllItems() {
    this.items.forEach(item => (item.selected = true));
    this.updateGroupSelectionStates();
  }

  deselectAllItems() {
    this.items.forEach(item => (item.selected = false));
    this.updateGroupSelectionStates();
  }

  get selectedItems(): CheckoutItem[] {
    return this.items.filter(item => item.selected);
  }

  get hasSelectedItems(): boolean {
    return this.selectedItems.length > 0;
  }

  get subtotal(): number {
    return this.selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get totalDiscount(): number {
    return this.selectedItems.reduce((sum, item) => sum + (item.subtotal - item.finalPrice), 0);
  }

  get total(): number {
    return this.selectedItems.reduce((sum, item) => sum + item.finalPrice, 0);
  }

  openSplitModal(item: CheckoutItem) {
    this.splitItem = item;
    this.splitQuantity = 2;
    this.showSplitModal = true;
  }

  closeSplitModal() {
    this.showSplitModal = false;
    this.splitItem = null;
    this.splitQuantity = 2;
  }

  confirmSplit() {
    if (!this.splitItem || this.splitQuantity < 2 || this.splitQuantity > this.splitItem.quantity) {
      alert('⚠️ Quantidade inválida para divisão');
      return;
    }
    const originalItem = this.splitItem;
    const qtyPerSplit = Math.floor(originalItem.quantity / this.splitQuantity);
    const remainder = originalItem.quantity % this.splitQuantity;
    const itemIndex = this.items.indexOf(originalItem);
    this.items.splice(itemIndex, 1);
    for (let i = 0; i < this.splitQuantity; i++) {
      const splitQty = i === 0 ? qtyPerSplit + remainder : qtyPerSplit;
      const splitSubtotal = splitQty * originalItem.unitPrice;
      let splitDiscount = originalItem.discount ? { ...originalItem.discount } : undefined;
      if (splitDiscount) {
        if (splitDiscount.type === DiscountType.PERCENTAGE) {
          // Mantém mesma %
        } else {
          // Desconto fixo proporcional
          const proportion = splitQty / originalItem.quantity;
          splitDiscount.value = Math.round(splitDiscount.value * proportion * 100) / 100;
        }
      }
      const splitFinalPrice = splitDiscount
        ? splitDiscount.type === DiscountType.PERCENTAGE
          ? splitSubtotal * (1 - splitDiscount.value / 100)
          : splitSubtotal - splitDiscount.value
        : splitSubtotal;
      this.items.push({
        ...originalItem,
        quantity: splitQty,
        subtotal: splitSubtotal,
        finalPrice: splitFinalPrice,
        discount: splitDiscount,
        isSplit: true,
        splitIndex: i + 1,
        totalSplits: this.splitQuantity,
        selected: false,
      });
    }
    this.groupItemsByClient();
    this.closeSplitModal();
  }

  openDiscountModal(item: CheckoutItem) {
    this.discountItem = item;
    this.discountType = DiscountType.PERCENTAGE;
    this.discountValue = 0;
    this.discountDescription = '';
    this.showDiscountModal = true;
  }

  closeDiscountModal() {
    this.showDiscountModal = false;
    this.discountItem = null;
    this.discountType = DiscountType.PERCENTAGE;
    this.discountValue = 0;
    this.discountDescription = '';
  }

  confirmDiscount() {
    if (!this.discountItem || this.discountValue < 0) {
      alert('⚠️ Valor de desconto inválido');
      return;
    }
    if (this.discountType === DiscountType.PERCENTAGE && this.discountValue > 100) {
      alert('⚠️ Desconto percentual não pode ser maior que 100%');
      return;
    }
    if (
      this.discountType === DiscountType.FIXED &&
      this.discountValue > this.discountItem.subtotal
    ) {
      alert('⚠️ Desconto fixo não pode ser maior que o subtotal');
      return;
    }
    this.applyDiscountToItem(
      this.discountItem,
      this.discountType,
      this.discountValue,
      this.discountDescription
    );
    this.closeDiscountModal();
  }

  removeDiscount(item: CheckoutItem) {
    item.discount = undefined;
    item.finalPrice = item.subtotal;
  }

  applyDiscountToItem(item: CheckoutItem, type: DiscountType, value: number, description: string) {
    item.discount = { type, value, description };
    if (type === DiscountType.PERCENTAGE) {
      item.finalPrice = item.subtotal * (1 - value / 100);
    } else {
      item.finalPrice = item.subtotal - value;
    }
    item.finalPrice = Math.max(0, Math.round(item.finalPrice * 100) / 100);
  }

  openHistoryModal() {
    this.showHistoryModal = true;
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
  }

  getTotalPaid(): number {
    return this.billHistory
      .filter(bill => bill.status === BillStatus.PAID)
      .reduce((sum, bill) => sum + bill.finalTotal, 0);
  }

  goToPayment() {
    if (!this.hasSelectedItems) {
      alert('⚠️ Selecione pelo menos um item para pagar');
      return;
    }
    this.step = 'payment';
  }

  backToItems() {
    this.step = 'select-items';
  }

  async processPayment() {
    if (!this.selectedTable || !this.hasSelectedItems) {
      alert('⚠️ Dados incompletos');
      return;
    }
    this.loading = true;
    try {
      const billData: CreateBillDTO = {
        tableId: this.selectedTable.id,
        tableNumber: this.selectedTable.number,
        orderIds: [...new Set(this.selectedItems.map(item => item.orderId))],
        items: this.selectedItems.map(item => ({
          orderId: item.orderId,
          orderItemId: item.orderItemId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          originalQuantity: item.originalQuantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          discount: item.discount,
          finalPrice: item.finalPrice,
          isSplit: item.isSplit,
          splitIndex: item.splitIndex,
          totalSplits: item.totalSplits,
        })),
        paymentMethod: this.paymentMethod,
        notes: this.paymentNotes || undefined,
      };
      const response = await this.billService.createBill(billData).toPromise();
      if (response?.success && response.data._id) {
        await this.billService.markAsPaid(response.data._id, this.paymentMethod).toPromise();
        alert('✅ Pagamento processado com sucesso!');
        const paidItemIds = new Set(this.selectedItems.map(item => item.orderItemId));
        this.items = this.items.filter(item => !paidItemIds.has(item.orderItemId));
        this.paymentMethod = PaymentMethod.CASH;
        this.paymentNotes = '';
        this.items.length > 0 ? (this.step = 'select-items') : this.resetCheckout();
        this.loadBillHistory();
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('❌ Erro ao processar pagamento');
    } finally {
      this.loading = false;
    }
  }

  resetCheckout() {
    this.selectedTable = null;
    this.orders = [];
    this.items = [];
    this.billHistory = [];
    this.step = 'select-table';
    this.paymentMethod = PaymentMethod.CASH;
    this.paymentNotes = '';
  }

  changeTable() {
    if (confirm('Deseja trocar de mesa? Os itens selecionados serão perdidos.')) {
      this.resetCheckout();
    }
  }
}
