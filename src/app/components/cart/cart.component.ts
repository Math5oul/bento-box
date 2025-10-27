// cart.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Renderer2,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart-service/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  imports: [CommonModule],
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeCart = new EventEmitter<void>();

  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  public _cartService = inject(CartService);

  ngOnInit() {
    // Move o elemento para o body ao inicializar
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    // Remove o elemento do body ao destruir
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }
  }

  get carrinho() {
    return this._cartService.getCurrentItems();
  }

  get total() {
    return this._cartService.getTotal();
  }

  decreaseQuantity(item: CartItem): void {
    this._cartService.decreaseQuantity(item);
  }

  increaseQuantity(item: CartItem): void {
    this._cartService.addItem({ ...item, quantity: 1 });
  }
}
