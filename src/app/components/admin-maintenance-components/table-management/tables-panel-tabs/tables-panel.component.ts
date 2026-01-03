import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesCardComponent } from '../tables-card/tables-card.component';
import { AdminHeaderComponent } from '../../admin-header/admin-header.component';
import { ReservationsTabComponent } from '../reservations-tab/reservations-tab.component';

@Component({
  selector: 'app-tables-panel',
  standalone: true,
  imports: [CommonModule, TablesCardComponent, ReservationsTabComponent, AdminHeaderComponent],
  templateUrl: './tables-panel.component.html',
  styleUrls: ['./tables-panel.component.scss'],
})
export class TablesManagementComponent {
  activeTab: 'tables' | 'reservations' = 'tables';
}
