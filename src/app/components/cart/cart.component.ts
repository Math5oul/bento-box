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
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart-service/cart.service';
import {
  OrderService,
  OrderItem,
  CreateOrderDTO,
} from '../../services/order-service/order.service';
import { AuthService } from '../../services/auth-service/auth.service';

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
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  isPlacingOrder = false;
  orderSuccess = false;
  orderError = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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

  async finalizarPedido(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isPlacingOrder = true;
    this.orderError = '';
    this.orderSuccess = false;

    try {
      // Verifica se tem mesa selecionada (sessão anônima ou usuário)
      const tableId = localStorage.getItem('tableId');

      if (!tableId) {
        this.orderError =
          'Você precisa estar em uma mesa para fazer pedidos. Escaneie o QR Code da mesa.';
        this.isPlacingOrder = false;
        return;
      }

      const cartItems = this._cartService.getCurrentItems();

      if (cartItems.length === 0) {
        this.orderError = 'Carrinho vazio';
        this.isPlacingOrder = false;
        return;
      }

      // Converte itens do carrinho para formato do pedido
      const orderItems: OrderItem[] = cartItems.map(item => ({
        productId: (item as any).id || Math.floor(Math.random() * 10000), // Usa ID se existir
        productName: item.productName,
        productImage: item.image,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        notes: item.observations,
      }));

      const orderData: CreateOrderDTO = {
        tableId,
        items: orderItems,
      };

      const response = await this.orderService.createOrder(orderData).toPromise();

      if (response && response.success) {
        this.orderSuccess = true;
        this._cartService.clearCart();

        // Fecha o carrinho após 2 segundos
        setTimeout(() => {
          this.closeCart.emit();
          this.orderSuccess = false;
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      this.orderError = error.error?.message || 'Erro ao processar pedido. Tente novamente.';
    } finally {
      this.isPlacingOrder = false;
    }
  }
}
