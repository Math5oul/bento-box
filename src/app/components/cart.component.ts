import { Component } from "@angular/core";
import { CartService, CartItem } from "../services/cart.service";

@Component({
  selector: "app-cart",
  templateUrl: "./cart.component.html",
  styleUrl: "./cart.component.scss",
  standalone: true,
  imports: [],
})
export class CartComponent {
  constructor(public cartService: CartService) {}

  get items(): CartItem[] {
    return this.cartService.getItems();
  }

  get total(): number {
    return this.cartService.getTotal();
  }
}
