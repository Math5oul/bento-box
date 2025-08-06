import { Component } from '@angular/core';
import { CartService } from '../../services/cart-service/cart.service';
import { CartComponent } from '../cart/cart.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CartComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isCartOpen = false;

  constructor(public _cartService: CartService) {}

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }
}
