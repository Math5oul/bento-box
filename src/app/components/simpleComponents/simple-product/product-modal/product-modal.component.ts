// product-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss']
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

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.resetForm();
  }

  incrementQuantity() {
    this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  submitOrder() {
    this.orderSubmitted.emit({
      productName: this.productName,
      quantity: this.quantity,
      observations: this.observations
    });
    this.close();
  }

  private resetForm() {
    this.quantity = 1;
    this.observations = '';
  }

}
