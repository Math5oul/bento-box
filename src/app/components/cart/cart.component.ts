import { Component } from '@angular/core';
import {
  CartItem,
  CartService,
} from '../../services/cart-service/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class CartComponent {
  constructor(public _cartService: CartService) {}

  get items(): CartItem[] {
    return this._cartService.getItems();
  }

  get total(): number {
    return this._cartService.getTotal();
  }
}
