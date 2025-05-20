import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { SanitizePipe } from '../../../pipes/saniteize.pipe';
import { ProductModalComponent } from './product-modal/product-modal.component';

@Component({
  selector: 'app-simple-product',
  standalone: true,
  imports: [CommonModule, SanitizePipe, ProductModalComponent],
  templateUrl: './simple-product.component.html',
  styleUrl: './simple-product.component.scss',
})
export class SimpleProductComponent {
  @Input() format: '1x1' | '1x2' | '2x1' | '2x2' = '1x1';
  @Input() colorMode: string = 'dark';
  @Input() imageUrl: string = '';
  @Input() productName: string = '';
  @Input() description: string = '';
  @Input() price: number = 0;

  @ViewChild(ProductModalComponent) productModal!: ProductModalComponent;
  openModal() {
    this.productModal.open();
  }

  handleOrder(order: { quantity: number; observations: string }) {
    console.log('Pedido enviado:', order);
  }
}
