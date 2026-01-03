import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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

interface Order {
  id: string;
  clientName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: Date | string;
  notes?: string;
}

@Component({
  selector: 'app-table-orders-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-orders-modal.component.html',
  styleUrls: ['./table-orders-modal.component.scss'],
})
export class TableOrdersModalComponent {
  @Input() tableNumber: number = 0;
  @Input() orders: Order[] = [];
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pendente',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#ff9800',
      preparing: '#2196f3',
      ready: '#4caf50',
      delivered: '#9e9e9e',
      cancelled: '#f44336',
    };
    return colors[status] || '#757575';
  }

  getTotalConsumption(): number {
    return this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  getOrderTime(order: Order): string {
    const date = new Date(order.createdAt);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
}
