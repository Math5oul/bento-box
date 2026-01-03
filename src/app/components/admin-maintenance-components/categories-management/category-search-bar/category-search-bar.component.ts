import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-search-bar.component.html',
  styleUrls: ['./category-search-bar.component.scss'],
})
export class CategorySearchBarComponent {
  @Input() searchTerm: string = '';
  @Input() filteredCount: number = 0;
  @Input() totalCount: number = 0;

  @Output() searchTermChange = new EventEmitter<string>();

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchTermChange.emit('');
  }
}
