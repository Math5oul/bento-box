import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SanitizePipe } from '../../../../pipes/sanitize.pipe';

interface FillerContent {
  text?: string;
  backgroundColor?: string;
  url?: string;
  videoUrl?: string;
  alt?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
}

interface GridPosition {
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

interface Filler {
  _id: string;
  type: 'text' | 'image' | 'video';
  content: FillerContent;
  categories: string[];
  formats: string[];
  active: boolean;
  gridPosition?: GridPosition;
}

@Component({
  selector: 'app-filler-card',
  standalone: true,
  imports: [CommonModule, SanitizePipe],
  templateUrl: './filler-card.component.html',
  styleUrls: ['./filler-card.component.scss'],
})
export class FillerCardComponent {
  @Input() filler!: Filler;
  @Input() categoryEmojis: string = '';

  @Output() edit = new EventEmitter<Filler>();
  @Output() delete = new EventEmitter<Filler>();

  getTypeEmoji(type: string): string {
    const emojis: { [key: string]: string } = {
      text: '📝',
      image: '🖼️',
      video: '🎥',
    };
    return emojis[type] || '📦';
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.style.display = 'none';
  }

  onEdit(): void {
    this.edit.emit(this.filler);
  }

  onDelete(): void {
    this.delete.emit(this.filler);
  }
}
