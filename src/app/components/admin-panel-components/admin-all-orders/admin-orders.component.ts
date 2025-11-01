import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../../interfaces';
import { OrderService } from '../../../services/order-service/order.service';

interface OrdersByTable {
  tableNumber: number;
  tableId: string;
  orders: Order[];
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss'],
})
export class AdminOrdersComponent implements OnInit {
  @Input() scrollToTableNumber: number | null = null;
  ordersByTable: OrdersByTable[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scrollToTableNumber'] && this.scrollToTableNumber != null) {
      setTimeout(() => this.scrollToTable(this.scrollToTableNumber as number), 50);
    }
  }

  public scrollToTable(tableNumber: number) {
    try {
      const selector = `[data-table-number='${tableNumber}']`;
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // briefly highlight
        const original = el.style.boxShadow;
        el.style.transition = 'box-shadow 0.4s ease';
        el.style.boxShadow = '0 0 0 3px rgba(33,150,243,0.25)';
        setTimeout(() => {
          el.style.boxShadow = original || '';
        }, 1200);
      }
    } catch (err) {
      console.error('Erro ao rolar para a mesa:', err);
    }
  }

  loadOrders() {
    this.isLoading = true;
    this.error = null;
    this.orderService.getAllOrdersGroupedByTable().subscribe({
      next: data => {
        this.ordersByTable = data;
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erro ao carregar pedidos.';
        this.isLoading = false;
      },
    });
  }

  getStatusLabel(status: OrderStatus) {
    return this.orderService.getStatusLabel(status);
  }

  getStatusColor(status: OrderStatus) {
    return this.orderService.getStatusColor(status);
  }

  getTotalOrders(): number {
    return this.ordersByTable.reduce((total, mesa) => total + mesa.orders.length, 0);
  }

  getMesaTotal(mesa: OrdersByTable): number {
    return mesa.orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  }

  isHighlighted(order: Order): boolean {
    // Destacar pedidos pendentes ou em preparo
    return order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING;
  }

  getOrderTime(order: Order): string {
    if (!order.createdAt) return 'Recente';

    const now = new Date();
    const orderDate = new Date(order.createdAt);
    const diff = now.getTime() - orderDate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours}h`;

    return orderDate.toLocaleDateString('pt-BR');
  }
}
