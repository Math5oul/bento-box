import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../interfaces/product.interface';
import { Category } from '../../../../interfaces/category.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-card" [class.unavailable]="!product.available">
      <!-- Badge de disponibilidade -->
      <div
        class="availability-badge"
        [class.available]="product.available"
        (click)="toggleAvailability.emit(product)"
        title="Clique para alterar disponibilidade"
      >
        {{ product.available ? '✅ Disponível' : '❌ Indisponível' }}
      </div>

      <!-- Informações do produto -->
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <p class="description">{{ truncateText(product.description, 80) }}</p>

        <div class="product-meta">
          <span class="category">
            {{ getCategoryEmoji(product.category) }} {{ product.category }}
          </span>
          <span class="price">{{ formatPrice(product.price) }}</span>
        </div>

        <div class="product-details">
          @if (product.format) {
            <span class="detail-tag">📐 {{ product.format }}</span>
          }
          @if (product.colorMode) {
            <span class="detail-tag">
              {{ product.colorMode === 'light' ? '☀️' : '🌙' }} {{ product.colorMode }}
            </span>
          }
          <span class="detail-tag">🖼️ {{ product.images.length || 0 }} imagens</span>
        </div>
      </div>

      <!-- Miniatura das imagens -->
      @if (product.images && product.images.length > 0) {
        <div class="product-images">
          @for (img of product.images.slice(0, 3); track $index) {
            <img [src]="img" [alt]="product.name" class="thumbnail" />
          }
          @if (product.images.length > 3) {
            <span class="more-images"> +{{ product.images.length - 3 }} </span>
          }
        </div>
      }

      <!-- Ações -->
      <div class="product-actions">
        <button class="edit-btn" (click)="edit.emit(product)">✏️ Editar</button>
        <button class="delete-btn" (click)="delete.emit(product)">🗑️ Deletar</button>
      </div>
    </div>
  `,
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
