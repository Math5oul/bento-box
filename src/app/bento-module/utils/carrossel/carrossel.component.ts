import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
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
  @Output() imageClicked = new EventEmitter<string>();

  currentImageIndex: number = 0;
  dragging: boolean = false;
  dragStartX: number = 0;
  dragOffsetX: number = 0;

  private getEventX(event: MouseEvent | TouchEvent): number {
    return event instanceof TouchEvent
      ? event.touches[0].clientX
      : event.clientX;
  }

  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  prevImage() {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.images.length) % this.images.length;
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

  handleDragEnd() {
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
