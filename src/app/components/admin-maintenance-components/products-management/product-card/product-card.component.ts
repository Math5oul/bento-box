import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../interfaces/product.interface';
import { Category } from '../../../../interfaces/category.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() categories: Category[] = [];

  @Output() edit = new EventEmitter<Product>();
  @Output() delete = new EventEmitter<Product>();
  @Output() toggleAvailability = new EventEmitter<Product>();

  getCategoryEmoji(slug: string): string {
    const category = this.categories.find(c => c.slug === slug);
    return category ? category.emoji : '📦';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
