import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
@Component({
  selector: 'app-carrossel',
  standalone: true,
  imports: [],
  templateUrl: './carrossel.component.html',
  styleUrl: './carrossel.component.scss',
})
export class CarrosselComponent implements AfterViewInit, OnDestroy {
  @Input() images: string[] = [];
  @Input() currentIndex: number = 0;
  @Output() currentIndexChange = new EventEmitter<number>();

  @ViewChild('imagesRow', { static: true }) imagesRowRef!: ElementRef;

  private touchStartHandler!: (e: TouchEvent) => void;
  private touchMoveHandler!: (e: TouchEvent) => void;

  dragging: boolean = false;
  dragStartX: number = 0;
  dragOffsetX: number = 0;

  /**
   * Inicializa os listeners de eventos `touchstart` e `touchmove` com a opção `passive: true`
   * para otimizar o desempenho em dispositivos móveis.
   *
   * Os handlers são registrados diretamente com `addEventListener` para permitir a configuração
   * da flag `passive`, que não é suportada pela API `Renderer2`.
   */
  ngAfterViewInit(): void {
    const element = this.imagesRowRef.nativeElement;

    this.touchStartHandler = (e: TouchEvent) => this.handleDragStart(e);
    element.addEventListener('touchstart', this.touchStartHandler, {
      passive: true,
    });

    this.touchMoveHandler = (e: TouchEvent) => this.handleDragMove(e);
    element.addEventListener('touchmove', this.touchMoveHandler, {
      passive: true,
    });
  }

  /**
   * Remove os listeners de `touchstart` e `touchmove` registrados manualmente no `ngAfterViewInit()`.
   */
  ngOnDestroy(): void {
    const element = this.imagesRowRef.nativeElement;
    element.removeEventListener('touchstart', this.touchStartHandler);
    element.removeEventListener('touchmove', this.touchMoveHandler);
  }

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
    if (event instanceof MouseEvent) {
      event.preventDefault();
    }
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
  handleDragEnd(): void {
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
}
