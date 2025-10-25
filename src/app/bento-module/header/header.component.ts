import { Component, EventEmitter, Output } from '@angular/core';
import { CartService } from '../../services/cart-service/cart.service';
import { CartComponent } from '../cart/cart.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CartComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isCartOpen = false;

  @Output() search = new EventEmitter<string>();

  constructor(public _cartService: CartService) {}

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  onSearchInput(value: string) {
    this.search.emit(value);
  }
}
