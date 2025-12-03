import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTablesTabComponent } from '../admin-tables-tab/admin-tables-tab.component';
import { AdminReservationsTabComponent } from '../admin-reservations-tab/admin-reservations-tab.component';
import { AdminHeaderComponent } from '../../admin-maintenance-components/admin-header/admin-header.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminTablesTabComponent,
    AdminReservationsTabComponent,
    AdminHeaderComponent,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent {
  activeTab: 'tables' | 'reservations' = 'tables';
}
