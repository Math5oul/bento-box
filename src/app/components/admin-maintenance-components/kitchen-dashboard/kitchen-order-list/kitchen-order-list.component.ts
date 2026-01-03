import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenOrderCardComponent } from '../kitchen-order-card/kitchen-order-card.component';

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
  selector: 'app-kitchen-order-list',
  standalone: true,
  imports: [CommonModule, KitchenOrderCardComponent],
  templateUrl: './kitchen-order-list.component.html',
  styleUrls: ['./kitchen-order-list.component.scss'],
})
export class KitchenOrderListComponent {
  @Input() orders: KitchenOrder[] = [];
  @Input() canManageOrders: boolean = false;
  @Input() canCancelOrders: boolean = false;
  @Input() isHistory: boolean = false;
  @Input() title: string = '';
  @Input() count: number = 0;
  @Input() showToggle: boolean = false;
  @Input() isExpanded: boolean = true;
  @Input() tablesMap: Map<string, Table> = new Map();

  @Output() itemStatusUpdate = new EventEmitter<{
    order: KitchenOrder;
    item: KitchenOrderItem;
    status: string;
  }>();
  @Output() orderCancel = new EventEmitter<KitchenOrder>();
  @Output() toggleExpanded = new EventEmitter<void>();

  onItemStatusUpdate(event: { order: KitchenOrder; item: KitchenOrderItem; status: string }): void {
    this.itemStatusUpdate.emit(event);
  }

  onOrderCancel(order: KitchenOrder): void {
    this.orderCancel.emit(order);
  }

  onToggle(): void {
    this.toggleExpanded.emit();
  }
}
