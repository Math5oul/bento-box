import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FillerCardComponent } from '../filler-card/filler-card.component';

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
  selector: 'app-filler-list',
  standalone: true,
  imports: [CommonModule, FillerCardComponent],
  templateUrl: './filler-list.component.html',
  styleUrls: ['./filler-list.component.scss'],
})
export class FillerListComponent {
  @Input() fillers: Filler[] = [];
  @Input() loading: boolean = false;
  @Input() totalFillers: number = 0;
  @Input() getCategoryEmojisCallback?: (categories: string[]) => string;

  @Output() fillerEdit = new EventEmitter<Filler>();
  @Output() fillerDelete = new EventEmitter<Filler>();

  getCategoryEmojis(categories: string[]): string {
    if (this.getCategoryEmojisCallback) {
      return this.getCategoryEmojisCallback(categories);
    }
    return categories.join(', ');
  }
}
