import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
@Component({
  selector: 'app-carrossel',
  standalone: true,
  imports: [],
  templateUrl: './carrossel.component.html',
  styleUrl: './carrossel.component.scss',
})
export class CarrosselComponent {
  @Input() images: string[] = [];
  @Input() currentIndex: number = 0;
  @Output() currentIndexChange = new EventEmitter<number>();

  dragging: boolean = false;
  dragStartX: number = 0;
  dragOffsetX: number = 0;
  isZoomed: boolean = false;
  zoomedImage: string = '';

  /**
   * Avança para a próxima imagem no carrossel
   */
  nextImage(): void {
    const newIndex = (this.currentIndex + 1) % this.images.length;
    this.setCurrentIndex(newIndex);
  }

  /**
   * Volta para a imagem anterior no carrossel
   */
  prevImage(): void {
    const newIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.setCurrentIndex(newIndex);
  }

  /**
   * Define uma nova imagem como atual no carrossel
   * @param index - O índice da imagem a ser exibida
   * @emits currentIndexChange - Notifica sobre a mudança de índice
   */
  setCurrentIndex(index: number): void {
    this.currentIndex = index;
    this.currentIndexChange.emit(index);
    this.dragOffsetX = 0;
  }

  /**
   * Abre uma imagem em modo de zoom
   * @param image - URL da imagem a ser ampliada
   */
  openZoom(image: string): void {
    this.isZoomed = true;
    this.zoomedImage = image;
  }

  /**
   * Fecha o modo de zoom da imagem
   */
  closeZoom(): void {
    this.isZoomed = false;
  }

  /**
   * Obtém a coordenada X de um evento de mouse ou toque
   * @param event - Evento de mouse ou touch
   * @returns A posição horizontal do evento
   * @private
   */
  private getEventX(event: MouseEvent | TouchEvent): number {
    return event instanceof TouchEvent
      ? event.touches[0].clientX
      : event.clientX;
  }

  /**
   * Inicia o rastreamento do movimento de arraste
   * @param event - Evento de mouse ou touch que iniciou o arraste
   */
  handleDragStart(event: MouseEvent | TouchEvent): void {
    this.dragging = true;
    this.dragStartX = this.getEventX(event);
    this.dragOffsetX = 0;
  }

  /**
   * Atualiza o deslocamento durante o movimento de arraste
   * @param event - Evento de mouse ou touch durante o movimento
   */
  handleDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) return;
    const currentX = this.getEventX(event);
    this.dragOffsetX = currentX - this.dragStartX;
  }

  /**
   * Finaliza o arraste e decide se deve mudar de imagem com base no deslocamento
   * @param event - Evento de mouse ou touch que finalizou o arraste
   */
  handleDragEnd(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) return;

    const threshold = 100;
    if (this.dragOffsetX > threshold) {
      this.prevImage();
    } else if (this.dragOffsetX < -threshold) {
      this.nextImage();
    }

    this.dragging = false;
    this.dragOffsetX = 0;
  }

  /**
   * Fecha o zoom quando a tecla ESC é pressionada
   * @param event - Evento de teclado
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent): void {
    if (this.isZoomed) {
      this.closeZoom();
    }
  }
}
