import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SanitizePipe } from '../../../pipes/saniteize.pipe';


@Component({
  selector: 'app-simple-product',
  standalone: true,
  imports: [CommonModule, SanitizePipe],
  templateUrl: './simple-product.component.html',
  styleUrl: './simple-product.component.scss'
})
export class SimpleProductComponent {
  @Input() format: '1x1' | '1x2' | '2x1' | '2x2' = '1x1';
  @Input() colorMode: string = 'dark';
  @Input() imageUrl: string = '';
  @Input() productName: string = '';
  @Input() description: string = '';
  @Input() price: string = '';

}
