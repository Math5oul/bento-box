import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StatusOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-kitchen-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kitchen-filters.component.html',
  styleUrls: ['./kitchen-filters.component.scss'],
})
export class KitchenFiltersComponent {
  @Input() statuses: StatusOption[] = [];
  @Input() filterStatus: string = 'all';
  @Input() orderCount: number = 0;
  @Input() searchTerm: string = '';

  @Output() filterStatusChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();

  onFilterChange(value: string): void {
    this.filterStatus = value;
    this.filterStatusChange.emit(value);
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
  }
}
