import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StatusOption {
  value: string;
  label: string;
}

interface Table {
  id?: string;
  number: number;
  name?: string;
  capacity?: number;
  status?: string;
}

@Component({
  selector: 'app-waiter-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './waiter-filters.component.html',
  styleUrls: ['./waiter-filters.component.scss'],
})
export class WaiterFiltersComponent {
  @Input() tables: string[] = [];
  @Input() tablesMap: Map<string, Table> = new Map();
  @Input() statuses: StatusOption[] = [];
  @Input() filterTable: string = 'all';
  @Input() filterStatus: string = 'all';
  @Input() searchTerm: string = '';

  @Output() filterTableChange = new EventEmitter<string>();
  @Output() filterStatusChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() filtersApplied = new EventEmitter<void>();

  onFilterTableChange(value: string): void {
    this.filterTable = value;
    this.filterTableChange.emit(value);
    this.filtersApplied.emit();
  }

  onFilterStatusChange(value: string): void {
    this.filterStatus = value;
    this.filterStatusChange.emit(value);
    this.filtersApplied.emit();
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
    this.filtersApplied.emit();
  }

  getTableDisplayName(table: string): string {
    if (!table || table === 'null' || table === 'undefined') {
      return 'Sem Mesa';
    }

    // Consulta o mapa de mesas para pegar o nome customizado ou número
    const tableInfo = this.tablesMap.get(String(table));
    if (tableInfo) {
      // Se tem nome customizado, retorna apenas o nome
      if (tableInfo.name && tableInfo.name.trim()) {
        return tableInfo.name;
      }
      // Se não tem nome, retorna apenas o número
      return `Mesa ${tableInfo.number}`;
    }

    // Fallback caso não encontre no mapa
    const tableStr = String(table);
    if (tableStr.startsWith('custom-')) {
      return tableStr.replace('custom-', '').toUpperCase();
    }
    return `Mesa ${tableStr}`;
  }
}
