import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableStatus } from '../../../interfaces';
import { TableService } from '../../../services/table-service/table.service';

@Component({
  selector: 'app-admin-stats-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats-tab.component.html',
  styleUrl: './admin-stats-tab.component.scss',
})
export class AdminStatsTabComponent implements OnInit {
  tableService = inject(TableService);

  tables: Table[] = [];

  ngOnInit() {
    this.loadTables();
  }

  async loadTables() {
    await this.tableService.loadTables();
    this.tableService.tables$.subscribe(tables => {
      this.tables = tables;
    });
  }

  get totalTables(): number {
    return this.tables.length;
  }

  get occupiedTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.OCCUPIED).length;
  }

  get availableTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.AVAILABLE).length;
  }

  get reservedTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.RESERVED).length;
  }

  get closedTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.CLOSED).length;
  }

  get totalRevenue(): number {
    return this.tables.reduce((sum, table) => sum + (table.totalConsumption || 0), 0);
  }

  get averageConsumption(): number {
    const occupied = this.tables.filter(t => t.totalConsumption && t.totalConsumption > 0);
    if (occupied.length === 0) return 0;
    return this.totalRevenue / occupied.length;
  }

  get totalOrders(): number {
    return this.tables.reduce((sum, table) => sum + (table.currentOrders?.length || 0), 0);
  }

  get occupancyRate(): number {
    if (this.totalTables === 0) return 0;
    return (this.occupiedTablesCount / this.totalTables) * 100;
  }

  get totalCapacity(): number {
    return this.tables.reduce((sum, table) => sum + table.capacity, 0);
  }

  get currentOccupancy(): number {
    return this.tables
      .filter(t => t.status === TableStatus.OCCUPIED)
      .reduce((sum, table) => sum + table.capacity, 0);
  }
}
