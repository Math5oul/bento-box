import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderItem {
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
}

interface WaiterOrder {
  id: string;
  tableNumber: string;
  clientName: string;
  isClientAnonymous?: boolean;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
})
export class OrderCardComponent {
  @Input() order!: WaiterOrder;
  @Input() canManageOrders: boolean = false;
  @Input() canCancelOrders: boolean = false;
  @Input() canDeliverOrders: boolean = false;
  @Input() editingNameOrderId: string | null = null;
  @Input() editingNameValue: string = '';

  @Output() editTable = new EventEmitter<string>();
  @Output() startEditName = new EventEmitter<WaiterOrder>();
  @Output() saveEditName = new EventEmitter<WaiterOrder>();
  @Output() cancelEditName = new EventEmitter<void>();
  @Output() updateItemStatus = new EventEmitter<{
    order: WaiterOrder;
    item: OrderItem;
    status: string;
  }>();
  @Output() openEditModal = new EventEmitter<WaiterOrder>();
  @Output() cancelOrder = new EventEmitter<WaiterOrder>();

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  getElapsedTime(createdAt: string): string {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diff = now - created;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  getTableDisplayName(table: string): string {
    if (!table) return 'Desconhecida';
    const tableStr = String(table);
    if (tableStr.startsWith('custom-')) {
      return tableStr.replace('custom-', '').toUpperCase();
    }
    return `Mesa ${tableStr}`;
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2)}`;
  }

  canEdit(order: WaiterOrder): boolean {
    return ['pending', 'confirmed', 'preparing'].includes(order.status);
  }

  onEditTable(): void {
    this.editTable.emit(this.order.tableNumber);
  }

  onStartEditName(): void {
    this.startEditName.emit(this.order);
  }

  onSaveEditName(): void {
    this.saveEditName.emit(this.order);
  }

  onCancelEditName(): void {
    this.cancelEditName.emit();
  }

  onUpdateItemStatus(item: OrderItem, status: string): void {
    this.updateItemStatus.emit({ order: this.order, item, status });
  }

  onOpenEditModal(): void {
    this.openEditModal.emit(this.order);
  }

  onCancelOrder(): void {
    this.cancelOrder.emit(this.order);
  }
}
