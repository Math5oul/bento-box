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
  isZoomed: boolean = false;
  touchStartX: number = 0;
  zoomedImage: string = '';

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

  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  prevImage() {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }

  handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  handleTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = touchEndX - this.touchStartX;

    if (Math.abs(diff) > 50) { // threshold for swipe
      if (diff > 0) {
        this.prevImage();
      } else {
        this.nextImage();
      }
    }
  }

  openZoom(image: string) {
    this.isZoomed = true;
    this.zoomedImage = image;
  }

  closeZoom() {
    this.isZoomed = false;
    this.zoomedImage = '';
  }

}
