import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SanitizePipe } from '../../../pipes/saniteize.pipe';
@Component({
  selector: 'app-simple-text',
  standalone: true,
  imports: [CommonModule, SanitizePipe],
  templateUrl: './simple-text.component.html',
  styleUrl: './simple-text.component.scss',
})
export class SimpleTextComponent {
  @Input() text: string = '';
  @Input() background: string = 'rebeccapurple';
}
