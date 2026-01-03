import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../interfaces/product.interface';
import { Category } from '../../../../interfaces/category.interface';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {
  @Input() products: Product[] = [];
  @Input() categories: Category[] = [];
  @Input() loading: boolean = false;
  @Input() searchTerm: string = '';
  @Input() totalProducts: number = 0;

  @Output() productEdit = new EventEmitter<Product>();
  @Output() productDelete = new EventEmitter<Product>();
  @Output() productToggleAvailability = new EventEmitter<Product>();
}
