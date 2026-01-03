import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FillerStats {
  total: number;
  text: number;
  image: number;
  video: number;
}

@Component({
  selector: 'app-filler-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filler-stats.component.html',
  styleUrls: ['./filler-stats.component.scss'],
})
export class FillerStatsComponent {
  @Input() stats: FillerStats = {
    total: 0,
    text: 0,
    image: 0,
    video: 0,
  };
}
