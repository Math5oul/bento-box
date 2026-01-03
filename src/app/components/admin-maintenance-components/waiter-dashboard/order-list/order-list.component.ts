import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderCardComponent } from '../order-card/order-card.component';

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
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, OrderCardComponent],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
})
export class OrderListComponent {
  @Input() orders: WaiterOrder[] = [];
  @Input() canManageOrders: boolean = false;
  @Input() canCancelOrders: boolean = false;
  @Input() canDeliverOrders: boolean = false;
  @Input() editingNameOrderId: string | null = null;
  @Input() editingNameValue: string = '';
  @Input() filterStatus: string = 'all';
  @Input() filterTable: string = 'all';
  @Input() searchTerm: string = '';

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
}
