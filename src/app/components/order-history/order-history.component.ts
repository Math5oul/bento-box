import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order-service/order.service';
import { Order } from '../../interfaces/order.interface';

@Component({
  selector: 'app-order-history-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
})
export class OrderHistoryComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  orders: Order[] = [];
  loading = true;
  error: string | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getUserOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: err => {
        this.error = 'Erro ao carregar pedidos';
        this.loading = false;
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}
