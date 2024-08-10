import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-simple-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simple-image.component.html',
  styleUrl: './simple-image.component.scss'
})
export class SimpleImageComponent {
  @Input() url!: string;
  @Input() width!: number;
  @Input() height!: number;

}
