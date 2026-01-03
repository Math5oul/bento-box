import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CategoryStats {
  totalCategories: number;
  totalProducts: number;
}

@Component({
  selector: 'app-category-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-stats.component.html',
  styleUrls: ['./category-stats.component.scss'],
})
export class CategoryStatsComponent {
  @Input() stats: CategoryStats = {
    totalCategories: 0,
    totalProducts: 0,
  };
}
