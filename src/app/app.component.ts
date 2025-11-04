import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductModalContainerComponent } from './components/simpleComponents/simple-product/product-modal/product-modal-container/product-modal-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProductModalContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'bento-box';
}
