// cart.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Renderer2,
  ElementRef,
  inject,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart-service/cart.service';
import { OrderItem, CreateOrderDTO, Order } from '../../interfaces/order.interface';
import { User } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth-service/auth.service';
import { OrderService } from '../../services/order-service/order.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  imports: [CommonModule],
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Output() closeCart = new EventEmitter<void>();

  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  public _cartService = inject(CartService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  isPlacingOrder = false;
  orderSuccess = false;
  orderError = '';

  // Controle de abas
  activeTab: 'new' | 'history' = 'new';

  // Histórico de pedidos
  placedOrders: Order[] = [];
  private pollingSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Quando o carrinho abrir e tiver itens, volta para aba "Novo Pedido"
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      if (this.carrinho.length > 0) {
        this.activeTab = 'new';
      }
    }
  }

  ngOnInit() {
    // Move o elemento para o body ao inicializar
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);

    // Carrega histórico inicial
    this.loadOrderHistory();

    // Polling a cada 30 segundos para atualizar status
    this.pollingSubscription = interval(30000)
      .pipe(switchMap(() => this.loadOrderHistoryObservable()))
      .subscribe();

    // Recarrega histórico quando usuário faz login (pedidos transferidos)
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user && isPlatformBrowser(this.platformId)) {
        // Recarrega histórico para mostrar pedidos transferidos
        this.loadOrderHistory();
      }
    });
  }

  ngOnDestroy() {
    // Remove o elemento do body ao destruir
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }

    // Cancela subscriptions
    this.pollingSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
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
        selectedSize: item.selectedSize, // Inclui tamanho selecionado
      }));

      // Recupera nome do cliente (usuário logado ou anônimo)
      let clientName = '';
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          clientName = user.name || '';
        } catch {}
      }
      if (!clientName) {
        clientName = 'Cliente Anônimo';
      }

      const orderData: CreateOrderDTO = {
        tableId,
        items: orderItems,
        clientName,
      };

      const response = await this.orderService.createOrder(orderData).toPromise();

      if (response && response.success) {
        this.orderSuccess = true;
        this._cartService.clearCart();

        // Recarrega histórico de pedidos
        this.loadOrderHistory();

        // Muda para aba de histórico
        setTimeout(() => {
          this.activeTab = 'history';
          this.orderSuccess = false;
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      this.orderError = error.error?.message || 'Erro ao processar pedido. Tente novamente.';
    } finally {
      this.isPlacingOrder = false;
    }
  }

  /**
   * Carrega histórico de pedidos da mesa atual
   */
  private loadOrderHistory(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const tableId = localStorage.getItem('tableId');
    if (!tableId) {
      this.placedOrders = [];
      return;
    }

    this.orderService.getOrdersForCurrentTable(tableId).subscribe({
      next: orders => {
        this.placedOrders = orders;
      },
      error: err => {
        console.error('Erro ao carregar histórico de pedidos:', err);
      },
    });
  }

  /**
   * Versão Observable para o polling
   */
  private loadOrderHistoryObservable() {
    if (!isPlatformBrowser(this.platformId)) {
      return new Promise(resolve => resolve([]));
    }

    const tableId = localStorage.getItem('tableId');
    if (!tableId) {
      return new Promise(resolve => resolve([]));
    }

    return this.orderService.getOrdersForCurrentTable(tableId);
  }

  /**
   * Retorna label de status em português
   */
  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status as any);
  }

  /**
   * Formata tempo relativo do pedido
   */
  getOrderTime(order: Order): string {
    if (!order.createdAt) return '';

    const now = new Date();
    const created = new Date(order.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins === 1) return 'Há 1 min';
    if (diffMins < 60) return `Há ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Há 1h';
    if (diffHours < 24) return `Há ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Há 1 dia';
    return `Há ${diffDays} dias`;
  }
}
