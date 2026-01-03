import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProductStats {
  total: number;
  available: number;
  unavailable: number;
}

@Component({
  selector: 'app-product-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-stats.component.html',
  styleUrls: ['./product-stats.component.scss'],
})
export class ProductStatsComponent {
  @Input() stats: ProductStats = {
    total: 0,
    available: 0,
    unavailable: 0,
  };
}
