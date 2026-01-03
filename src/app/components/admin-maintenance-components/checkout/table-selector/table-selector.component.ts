import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table } from '../../../../interfaces/table.interface';

@Component({
  selector: 'app-table-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-selector.component.html',
  styleUrls: ['./table-selector.component.scss'],
})
export class TableSelectorComponent {
  @Input() tables: Table[] = [];
  @Output() tableSelected = new EventEmitter<Table>();

  onSelectTable(table: Table): void {
    if (table.status !== 'available') {
      this.tableSelected.emit(table);
    }
  }

  getTableDisplayName(table: Table): string {
    return (table as any).customName || `Mesa ${table.number}`;
  }
}
