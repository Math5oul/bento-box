import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../services/order-service/order.service';
import { Order, OrderStatus } from '../../interfaces/order.interface';

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
      // Wait a tick for DOM to render
      setTimeout(() => this.scrollToTable(this.scrollToTableNumber as number), 50);
    }
  }

  // Public method so parent can call directly via ViewChild
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
}
