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
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

interface CheckoutItem extends BillItem {
  selected: boolean;
  editing: boolean;
  clientName?: string;
  clientId?: string;
  sessionToken?: string;
  parentItemId?: string; // ID do item pai (se for subitem)
  isParentItem?: boolean; // Se é um item pai que foi dividido
  parentDiscount?: { type: DiscountType; value: number; description?: string }; // Desconto do item pai (para referência)
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
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
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
          // Calcula a quantidade não paga
          const paidQty = orderItem.paidQuantity || 0;
          const remainingQty = orderItem.quantity - paidQty;

          // Só adiciona se ainda houver quantidade não paga
          if (remainingQty > 0) {
            this.items.push({
              selected: false,
              editing: false,
              orderId: order.id,
              orderItemId: `${order.id}-${index}`,
              productId: String(orderItem.productId || ''),
              productName: orderItem.productName,
              quantity: remainingQty, // Usa apenas a quantidade não paga
              originalQuantity: orderItem.quantity, // Mantém a quantidade original
              unitPrice: orderItem.unitPrice,
              subtotal: remainingQty * orderItem.unitPrice,
              finalPrice: remainingQty * orderItem.unitPrice,
              isSplit: false,
              clientName: order.clientName,
              clientId: clientId, // Usa o ID extraído corretamente
              sessionToken: order.sessionToken,
            });
          }
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
    // Não permite dividir um item que já é um subitem
    if (item.isSplit) {
      alert('⚠️ Este item já está dividido. Para dividir novamente, primeiro remova a divisão.');
      return;
    }

    this.splitItem = item;
    this.splitQuantity = 2;
    this.showSplitModal = true;
  }

  closeSplitModal() {
    this.showSplitModal = false;
    this.splitItem = null;
    this.splitQuantity = 2;
  }

  // Função para desfazer a divisão de um item (reunificar subitens)
  undoSplit(item: CheckoutItem) {
    if (!item.isSplit || !item.parentItemId) return;

    // Encontra todos os subitens do mesmo pai
    const siblings = this.items.filter(i => i.parentItemId === item.parentItemId);

    if (siblings.length === 0) return;

    // Reconstrói o item original
    const totalQuantity = siblings.reduce((sum, sibling) => sum + sibling.quantity, 0);
    const firstSibling = siblings[0];

    const reunifiedItem: CheckoutItem = {
      ...firstSibling,
      quantity: totalQuantity,
      subtotal: totalQuantity * firstSibling.unitPrice,
      finalPrice: totalQuantity * firstSibling.unitPrice,
      discount: firstSibling.parentDiscount ? { ...firstSibling.parentDiscount } : undefined,
      parentDiscount: undefined,
      isSplit: false,
      splitIndex: undefined,
      totalSplits: undefined,
      parentItemId: undefined,
      isParentItem: false,
      selected: false,
    };

    // Recalcula o finalPrice com o desconto
    if (reunifiedItem.discount) {
      if (reunifiedItem.discount.type === DiscountType.PERCENTAGE) {
        reunifiedItem.finalPrice =
          reunifiedItem.subtotal * (1 - reunifiedItem.discount.value / 100);
      } else {
        reunifiedItem.finalPrice = reunifiedItem.subtotal - reunifiedItem.discount.value;
      }
      reunifiedItem.finalPrice = Math.max(0, Math.round(reunifiedItem.finalPrice * 100) / 100);
    }

    // Remove todos os subitens
    siblings.forEach(sibling => {
      const idx = this.items.indexOf(sibling);
      if (idx > -1) {
        this.items.splice(idx, 1);
      }
    });

    // Adiciona o item reunificado
    this.items.push(reunifiedItem);
    this.groupItemsByClient();
  }

  confirmSplit() {
    if (!this.splitItem || this.splitQuantity < 2) {
      alert('⚠️ Quantidade inválida para divisão. Mínimo: 2 partes');
      return;
    }
    const originalItem = this.splitItem;

    // Calcula o valor final do item pai (após descontos)
    const parentFinalPrice = originalItem.finalPrice;

    // Calcula o valor de cada subparte
    const pricePerPart = parentFinalPrice / this.splitQuantity;

    // Calcula a quantidade de cada subparte
    const qtyPerSplit = originalItem.quantity / this.splitQuantity;

    // Gera um ID único para o item pai
    const parentId = `parent-${originalItem.orderItemId}-${Date.now()}`;

    // Marca o item original como pai e remove da seleção
    const itemIndex = this.items.indexOf(originalItem);
    this.items.splice(itemIndex, 1);

    // Cria os subitens
    for (let i = 0; i < this.splitQuantity; i++) {
      // Cada subitem recebe uma parte igual do valor final
      const splitFinalPrice = Math.round(pricePerPart * 100) / 100;
      const splitSubtotal = Math.round(qtyPerSplit * originalItem.unitPrice * 100) / 100;

      this.items.push({
        ...originalItem,
        quantity: Math.round(qtyPerSplit * 100) / 100, // Arredonda para 2 casas decimais
        subtotal: splitSubtotal,
        finalPrice: splitFinalPrice,
        discount: undefined, // Subitens não têm desconto próprio
        parentDiscount: originalItem.discount ? { ...originalItem.discount } : undefined, // Guarda desconto do pai
        isSplit: true,
        splitIndex: i + 1,
        totalSplits: this.splitQuantity,
        selected: false,
        parentItemId: parentId,
        isParentItem: false,
      });
    }

    this.groupItemsByClient();
    this.closeSplitModal();
  }

  openDiscountModal(item: CheckoutItem) {
    // Não permite aplicar desconto em subitens
    if (item.isSplit) {
      alert(
        '⚠️ Não é possível aplicar desconto em itens divididos. O desconto deve ser aplicado antes da divisão.'
      );
      return;
    }

    this.discountItem = item;
    this.discountType = item.discount?.type || DiscountType.PERCENTAGE;
    this.discountValue = item.discount?.value || 0;
    this.discountDescription = item.discount?.description || '';
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
      // Calcula subtotal e total final
      const subtotal = this.selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const finalTotal = this.selectedItems.reduce((sum, item) => sum + item.finalPrice, 0);

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
        subtotal: subtotal,
        finalTotal: finalTotal,
        paymentMethod: this.paymentMethod,
        notes: this.paymentNotes || undefined,
      };
      const response = await this.billService.createBill(billData).toPromise();
      if (response?.success && response.data._id) {
        await this.billService.markAsPaid(response.data._id, this.paymentMethod).toPromise();
        alert('✅ Pagamento processado com sucesso!');

        // Remove ou atualiza itens pagos
        this.selectedItems.forEach(paidItem => {
          const itemIndex = this.items.findIndex(item => item.orderItemId === paidItem.orderItemId);
          if (itemIndex !== -1) {
            const currentItem = this.items[itemIndex];

            // Se a quantidade paga é igual à quantidade atual, remove completamente
            if (paidItem.quantity >= currentItem.quantity) {
              this.items.splice(itemIndex, 1);
            } else {
              // Se foi pago parcialmente, reduz a quantidade restante
              currentItem.quantity -= paidItem.quantity;
              currentItem.subtotal = currentItem.quantity * currentItem.unitPrice;
              currentItem.finalPrice = currentItem.subtotal;
              currentItem.selected = false; // Desmarca para não pagar novamente
            }
          }
        });

        this.paymentMethod = PaymentMethod.CASH;
        this.paymentNotes = '';
        this.groupItemsByClient(); // Reagrupa após atualizar quantidades
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

  async clearTable() {
    if (!this.selectedTable) {
      return;
    }

    if (
      confirm(
        `Deseja limpar a mesa ${this.selectedTable.number}? Isso irá liberar a mesa e limpar todos os dados. Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        this.loading = true;
        await this.tableService.clearTable(this.selectedTable.id);
        alert('✅ Mesa limpa com sucesso!');
        this.resetCheckout();
        await this.loadTables();
      } catch (error) {
        console.error('Erro ao limpar mesa:', error);
        alert('❌ Erro ao limpar mesa.');
      } finally {
        this.loading = false;
      }
    }
  }
}
