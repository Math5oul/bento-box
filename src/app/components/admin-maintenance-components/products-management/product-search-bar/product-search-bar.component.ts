import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-search-bar.component.html',
  styleUrls: ['./product-search-bar.component.scss'],
})
export class ProductSearchBarComponent {
  @Input() searchTerm: string = '';
  @Input() filteredCount: number = 0;
  @Input() totalCount: number = 0;
  @Output() searchTermChange = new EventEmitter<string>();

  onSearchChange(value: string): void {
    this.searchTermChange.emit(value);
  }

  clearSearch(): void {
    this.searchTermChange.emit('');
  }
}
