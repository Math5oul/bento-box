import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  isZoomed: boolean = false;
  touchStartX: number = 0;
  zoomedImage: string = '';

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

  /**
   * Avança para a próxima imagem no array de imagens
   * Volta para a primeira imagem se estiver na última
   */
  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  /**
   * Volta para a imagem anterior no array de imagens
   * Vai para a última imagem se estiver na primeira
   */
  prevImage() {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }

  /**
   * Manipula o início de um evento de toque para detecção de swipe
   * @param {TouchEvent} event - O evento de início de toque
   */
  handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  /**
   * Manipula o fim de um evento de toque para detectar gestos de swipe
   * Muda a imagem com base na direção do swipe se o movimento exceder o limite
   * @param {TouchEvent} event - O evento de fim de toque
   */
  handleTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = touchEndX - this.touchStartX;

    if (Math.abs(diff) > 50) {
      // limite para considerar swipe
      if (diff > 0) {
        this.prevImage();
      } else {
        this.nextImage();
      }
    }
  }

  /**
   * Abre a visualização ampliada para a imagem especificada
   * @param {string} image - O URL/caminho da imagem para ampliar
   */
  openZoom(image: string) {
    this.isZoomed = true;
    this.zoomedImage = image;
  }

  /**
   * Fecha a visualização de imagem ampliada
   */
  closeZoom() {
    this.isZoomed = false;
    this.zoomedImage = '';
  }

  dragging: boolean = false;
  dragStartX: number = 0;
  dragOffsetX: number = 0;

  // Track X coordinate
  private getEventX(event: MouseEvent | TouchEvent): number {
    return event instanceof TouchEvent
      ? event.touches[0].clientX
      : event.clientX;
  }

  handleDragStart(event: MouseEvent | TouchEvent) {
    this.dragging = true;
    this.dragStartX = this.getEventX(event);
    this.dragOffsetX = 0;
  }

  handleDragMove(event: MouseEvent | TouchEvent) {
    if (!this.dragging) return;
    const currentX = this.getEventX(event);
    this.dragOffsetX = currentX - this.dragStartX;
  }

  handleDragEnd(event: MouseEvent | TouchEvent) {
    if (!this.dragging) return;

    const threshold = 100; // pixels to switch images
    if (this.dragOffsetX > threshold) {
      this.prevImage();
    } else if (this.dragOffsetX < -threshold) {
      this.nextImage();
    }

    this.dragging = false;
    this.dragOffsetX = 0;
  }
}
