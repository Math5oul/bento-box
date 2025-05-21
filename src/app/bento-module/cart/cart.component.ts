// cart.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart-service/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  imports: [CommonModule],
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  @Input() isOpen = false;
  @Output() closeCart = new EventEmitter<void>();

  constructor(public _cartService: CartService) {}

  get carrinho() {
    return this._cartService.getCurrentItems();
  }

  get total() {
    return this._cartService.getTotal();
  }


}
