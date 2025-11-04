import { Component, EventEmitter, Input, Output, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarrosselComponent } from '../../../carrossel/carrossel.component';
import { CartItemSize } from '../../../../services/cart-service/cart.service';
import { SanitizePipe } from '../../../../pipes/sanitize.pipe';
import { Product, ProductVariation } from '../../../../interfaces';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CarrosselComponent, SanitizePipe],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss'],
})
export class ProductModalComponent {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @Input() images: string[] = [];
  currentImageIndex: number = 0;
  @Input() productName: string = '';
  @Input() description: string = '';
  @Input() price: number = 0;
  @Input() sizes: Array<{ name: string; abbreviation: string; price: number }> = [];
  @Input() variations: ProductVariation[] = [];

  @Output() orderSubmitted = new EventEmitter<{
    productName: string;
    quantity: number;
    observations: string;
    selectedSize?: CartItemSize;
    selectedVariation?: ProductVariation;
  }>();

  isOpen: boolean = false;
  quantity: number = 1;
  observations: string = '';
  selectedSize: CartItemSize | null = null;
  selectedVariation: ProductVariation | null = null;

  /**
   * Abre o modal de produto
   */
  open() {
    this.isOpen = true;
    // Bloqueia o scroll do body (apenas no browser)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
    // Se houver apenas um tamanho, seleciona automaticamente
    if (this.sizes && this.sizes.length === 1) {
      this.selectedSize = { ...this.sizes[0] };
    }
  }

  /**
   * Fecha o modal de produto e reseta o formulário
   */
  close() {
    this.isOpen = false;
    // Libera o scroll do body (apenas no browser)
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
    this.resetForm();
  }

  /**
   * Incrementa a quantidade do produto em 1
   */
  incrementQuantity() {
    this.quantity++;
  }

  /**
   * Decrementa a quantidade do produto em 1, mas não abaixo de 1
   */
  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Emite um evento de submissão de pedido com os detalhes do produto atual
   * e fecha o modal
   */
  submitOrder() {
    this.orderSubmitted.emit({
      productName: this.productName,
      quantity: this.quantity,
      observations: this.observations,
      selectedSize: this.selectedSize || undefined,
      selectedVariation: this.selectedVariation || undefined,
    });
    this.close();
  }

  /**
   * Seleciona um tamanho
   */
  selectSize(size: { name: string; abbreviation: string; price: number }) {
    this.selectedSize = { ...size };
  }

  /**
   * Seleciona uma variação
   */
  selectVariation(variation: ProductVariation) {
    // Se clicar na mesma variação, desseleciona
    if (this.selectedVariation?.title === variation.title) {
      this.selectedVariation = null;
    } else {
      this.selectedVariation = { ...variation };
    }
  }

  /**
   * Retorna o preço atual (do tamanho selecionado + variação selecionada ou preço base)
   */
  getCurrentPrice(): number {
    let currentPrice = this.price;

    // Adiciona preço do tamanho selecionado
    if (this.selectedSize) {
      currentPrice = this.selectedSize.price;
    }

    // Adiciona preço da variação selecionada
    if (this.selectedVariation) {
      currentPrice += this.selectedVariation.price;
    }

    return currentPrice;
  }

  /**
   * Verifica se deve mostrar a seção de seleção de tamanhos
   */
  shouldShowSizeSelection(): boolean {
    return this.sizes && this.sizes.length > 1;
  }

  /**
   * Verifica se deve mostrar a seção de seleção de variações
   */
  shouldShowVariantsSelection(): boolean {
    return this.variations && this.variations.length > 0;
  }

  /**
   * Reseta o formulário para o estado inicial
   * @private
   */
  private resetForm() {
    this.quantity = 1;
    this.observations = '';
    this.selectedSize = null;
    this.selectedVariation = null;
  }
}
