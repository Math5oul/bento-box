import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../interfaces/category.interface';

@Component({
  selector: 'app-filler-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filler-filters.component.html',
  styleUrls: ['./filler-filters.component.scss'],
})
export class FillerFiltersComponent {
  @Input() categories: Category[] = [];
  @Input() filterCategory: string = '';
  @Input() filterType: string = '';
  @Input() filteredCount: number = 0;
  @Input() totalCount: number = 0;

  @Output() filterCategoryChange = new EventEmitter<string>();
  @Output() filterTypeChange = new EventEmitter<string>();

  onCategoryChange(value: string): void {
    this.filterCategoryChange.emit(value);
  }

  onTypeChange(value: string): void {
    this.filterTypeChange.emit(value);
  }
}
