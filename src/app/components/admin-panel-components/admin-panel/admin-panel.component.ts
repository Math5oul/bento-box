import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  inject,
  Renderer2,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrdersComponent } from '../admin-all-orders/admin-orders.component';
import { AdminTablesTabComponent } from '../admin-tables-tab/admin-tables-tab.component';
import { AdminReservationsTabComponent } from '../admin-reservations-tab/admin-reservations-tab.component';
import { AdminStatsTabComponent } from '../admin-stats-tab/admin-stats-tab.component';

interface ReservationInfo {
  clientName: string;
  clientPhone: string;
  dateTime: Date | string;
  notes?: string;
  createdAt?: Date;
  createdBy?: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminOrdersComponent,
    AdminTablesTabComponent,
    AdminReservationsTabComponent,
    AdminStatsTabComponent,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild(AdminOrdersComponent) adminOrdersComponent?: AdminOrdersComponent;

  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  activeTab: 'tables' | 'orders' | 'stats' | 'reservations' = 'tables';
  pendingScrollToTable: number | null = null;

  ngOnInit() {
    // Move o elemento para o body ao inicializar
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    // Remove o elemento do body ao destruir
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }
  }

  closePanel() {
    this.close.emit();
  }

  /**
   * Abre a aba de pedidos e rola até a mesa especificada
   */
  viewTableOrders(tableNumber: number) {
    this.activeTab = 'orders';
    this.pendingScrollToTable = tableNumber;

    // Aguarda o componente renderizar e então executa o scroll
    setTimeout(() => {
      if (this.adminOrdersComponent) {
        this.adminOrdersComponent.scrollToTable(tableNumber);
      }
      this.pendingScrollToTable = null;
    }, 100);
  }
}
