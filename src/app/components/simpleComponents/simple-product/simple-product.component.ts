import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { SanitizePipe } from '../../../pipes/sanitize.pipe';
import { CartService, CartItemSize } from '../../../services/cart-service/cart.service';
import { ProductModalService } from '../../../services/product-modal-service/product-modal.service';
import { ProductVariation } from '../../../interfaces/product.interface';
import { DiscountService } from '../../../services/discount-service/discount.service';

@Component({
  selector: 'app-simple-product',
  standalone: true,
  imports: [CommonModule, SanitizePipe],
  templateUrl: './simple-product.component.html',
  styleUrl: './simple-product.component.scss',
})
export class SimpleProductComponent {
  private discountService = inject(DiscountService);
  @Input() inputs: {
    format: '1x1' | '1x2' | '2x1' | '2x2';
    colorMode: string;
    images: string[];
    productName: string;
    description: string;
    price: number;
    sizes?: Array<{ name: string; abbreviation: string; price: number }>;
    variations?: ProductVariation[];
    editMode: boolean;
  } = {
    format: '1x1',
    colorMode: 'dark',
    images: [],
    productName: '',
    description: '',
    price: 0,
    sizes: [],
    variations: [],
    editMode: false,
  };

  constructor(
    private cartService: CartService,
    private productModalService: ProductModalService
  ) {}

  handleClick(event: MouseEvent) {
    if (this.inputs.editMode) {
      return;
    } else {
      this.productModalService.openModal({
        images: this.inputs.images,
        productName: this.inputs.productName,
        price: this.inputs.price,
        description: this.inputs.description,
        sizes: this.inputs.sizes,
        variations: this.inputs.variations,
        category: (this.inputs as any).category || null,
        productId: (this.inputs as any)._id || (this.inputs as any).id || undefined,
        onOrderSubmitted: order => this.handleOrder(order),
      });
    }
  }

  getDiscountCalculation() {
    return this.discountService.calculatePrice(this.inputs.price, (this.inputs as any).category);
  }

  getFinalPrice(): number {
    return this.getDiscountCalculation().finalPrice;
  }

  hasDiscount(): boolean {
    return this.getDiscountCalculation().hasDiscount;
  }

  handleOrder(order: {
    quantity: number;
    productName?: string;
    observations?: string;
    selectedSize?: CartItemSize;
    selectedVariation?: ProductVariation;
  }) {
    // Preço base (tamanho ou preço padrão)
    const basePrice = order.selectedSize ? order.selectedSize.price : this.inputs.price;

    // Preço da variação (sempre sem desconto)
    const variationPrice = order.selectedVariation?.price || 0;

    // Calcula tudo usando o serviço centralizado
    const priceCalc = this.discountService.calculateFullItemPrice(
      basePrice,
      variationPrice,
      (this.inputs as any).category
    );

    this.cartService.addItem({
      id: (this.inputs as any)._id || (this.inputs as any).id,
      productId: (this.inputs as any)._id || (this.inputs as any).id,
      productName: this.inputs.productName,
      price: priceCalc.finalTotalPrice,
      quantity: order.quantity,
      observations: order.observations || '',
      image: this.inputs.images[0],
      selectedSize: order.selectedSize,
      selectedVariation: order.selectedVariation,
      totalSizes: this.inputs.sizes?.length || 0,
      // Informações de desconto
      category: (this.inputs as any).category,
      originalPrice: priceCalc.originalTotalPrice,
      discountPercent: priceCalc.baseDiscountPercent,
      discountAmount: priceCalc.totalDiscount,
      finalPrice: priceCalc.finalTotalPrice,
      hasDiscount: priceCalc.hasDiscount,
      // Campos separados
      basePriceOriginal: priceCalc.basePriceOriginal,
      basePriceWithDiscount: priceCalc.basePriceWithDiscount,
      variationPrice: priceCalc.variationPrice,
    });
  }
}
