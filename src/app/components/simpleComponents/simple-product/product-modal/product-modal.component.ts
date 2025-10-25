import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarrosselComponent } from '../../../../bento-module/utils/carrossel/carrossel.component';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CarrosselComponent],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss'],
})
export class ProductModalComponent {
  @Input() images: string[] = [];
  currentImageIndex: number = 0;
  @Input() productName: string = '';
  @Input() description: string = '';
  @Input() price: number = 0;

  @Output() orderSubmitted = new EventEmitter<{
    productName: string;
    quantity: number;
    observations: string;
  }>();

  isOpen: boolean = false;
  quantity: number = 1;
  observations: string = '';

  /**
   * Abre o modal de produto
   */
  open() {
    this.isOpen = true;
  }

  /**
   * Fecha o modal de produto e reseta o formulário
   */
  close() {
    this.isOpen = false;
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
    });
    this.close();
  }

  /**
   * Reseta o formulário para o estado inicial
   * @private
   */
  private resetForm() {
    this.quantity = 1;
    this.observations = '';
  }
}
