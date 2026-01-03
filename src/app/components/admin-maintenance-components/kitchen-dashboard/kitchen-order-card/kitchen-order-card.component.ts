import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-kitchen-order-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen-order-card.component.html',
  styleUrls: ['./kitchen-order-card.component.scss'],
})
export class KitchenOrderCardComponent {
  @Input() order!: KitchenOrder;
  @Input() canManageOrders: boolean = false;
  @Input() canCancelOrders: boolean = false;
  @Input() isHistory: boolean = false;
  @Input() tablesMap: Map<string, Table> = new Map();

  @Output() itemStatusUpdate = new EventEmitter<{
    order: KitchenOrder;
    item: KitchenOrderItem;
    status: string;
  }>();
  @Output() orderCancel = new EventEmitter<KitchenOrder>();

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
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
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  }

  getTableDisplayName(): string {
    if (this.order.tableNumber === undefined || this.order.tableNumber === null) {
      return '—';
    }

    const tableKey = this.order.tableNumber.toString();
    const tableInfo = this.tablesMap.get(tableKey);

    if (tableInfo?.name) {
      return tableInfo.name;
    }

    return `Mesa ${this.order.tableNumber}`;
  }
  onUpdateItemStatus(item: KitchenOrderItem, status: string): void {
    this.itemStatusUpdate.emit({ order: this.order, item, status });
  }

  onCancelOrder(): void {
    this.orderCancel.emit(this.order);
  }
}
