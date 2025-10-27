import { Component, OnInit } from '@angular/core';
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
  ordersByTable: OrdersByTable[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
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
