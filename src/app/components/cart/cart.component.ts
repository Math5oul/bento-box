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
import { FormsModule } from '@angular/forms';
import { ProductService } from './../../services/product-service/product.service';
import { Order, OrderItem, CreateOrderDTO, OrderStatus } from '../../interfaces/order.interface';
import { AuthService } from '../../services/auth-service/auth.service';
import { OrderService } from '../../services/order-service/order.service';
import { CartService, CartItem, CartItemSize } from './../../services/cart-service/cart.service';
import { ProductVariation } from '../../interfaces/product.interface';
import { interval, Subscription, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  imports: [CommonModule, FormsModule],
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
  private productService = inject(ProductService);

  isPlacingOrder = false;
  orderSuccess = false;
  orderError = '';

  // Controle de abas
  activeTab: 'new' | 'history' = 'new';

  // Histórico de pedidos
  placedOrders: Order[] = [];
  private pollingSubscription?: Subscription;
  private authSubscription?: Subscription;

  // Modal de edição
  showEditModal = false;
  editingItem: CartItem | null = null;
  editingItemOriginal: CartItem | null = null;
  editingItemSizes: CartItemSize[] = [];
  editingItemVariations: ProductVariation[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      if (this.carrinho.length > 0) {
        this.activeTab = 'new';
      }
    }
  }

  ngOnInit() {
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
    this.loadOrderHistory();

    this.pollingSubscription = interval(30000)
      .pipe(switchMap(() => this.loadOrderHistoryObservable()))
      .subscribe();

    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user && isPlatformBrowser(this.platformId)) {
        this.loadOrderHistory();
      }
    });
  }

  ngOnDestroy() {
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }

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

      // Converte itens do carrinho para formato do pedido INCLUINDO VARIAÇÕES
      const orderItems: OrderItem[] = cartItems.map(item => ({
        // Prefer explicit id/productId if present on the cart item. Do not synthesize a random id.
        productId: (item as any).id || (item as any).productId || undefined,
        productName: item.productName,
        productImage: item.image,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        notes: item.observations,
        selectedSize: item.selectedSize,
        selectedVariation: item.selectedVariation,
        status: OrderStatus.PENDING,
      }));

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
        status: OrderStatus.PENDING,
      };

      const response = await this.orderService.createOrder(orderData).toPromise();

      if (response && response.success) {
        this.orderSuccess = true;
        this._cartService.clearCart();

        this.loadOrderHistory();

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

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status as any);
  }

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

  shouldShowSize(item: CartItem): boolean {
    return !!item.selectedSize && !!item.totalSizes && item.totalSizes > 1;
  }

  shouldShowSizeInHistory(item: OrderItem): boolean {
    return item.selectedSize !== undefined;
  }

  openEditModal(item: CartItem): void {
    this.editingItemOriginal = item;
    this.editingItem = { ...item };
    this.showEditModal = true;

    // Buscar os tamanhos E variações disponíveis para este produto
    this.productService.getAllProducts({ search: item.productName }).subscribe({
      next: response => {
        if (response.success && response.data.length > 0) {
          const product = response.data[0];
          if (product && product.sizes) {
            this.editingItemSizes = product.sizes;
          } else {
            this.editingItemSizes = [];
          }
          if (product && product.variations) {
            this.editingItemVariations = product.variations;
          } else {
            this.editingItemVariations = [];
          }
        } else {
          this.editingItemSizes = [];
          this.editingItemVariations = [];
        }
      },
      error: () => {
        this.editingItemSizes = [];
        this.editingItemVariations = [];
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingItem = null;
    this.editingItemOriginal = null;
    this.editingItemSizes = [];
    this.editingItemVariations = [];
  }

  selectSizeForEdit(size: CartItemSize): void {
    if (this.editingItem) {
      this.editingItem.selectedSize = size;
      this.updateEditingItemPrice();
    }
  }

  selectVariationForEdit(variation: ProductVariation): void {
    if (this.editingItem) {
      // Se clicar na mesma variação, desseleciona
      if (this.editingItem.selectedVariation?.title === variation.title) {
        this.editingItem.selectedVariation = undefined;
      } else {
        this.editingItem.selectedVariation = { ...variation };
      }
      this.updateEditingItemPrice();
    }
  }

  private updateEditingItemPrice(): void {
    if (this.editingItem) {
      let basePrice = this.editingItemOriginal?.price || 0;

      // Se tiver tamanho selecionado, usa o preço do tamanho
      if (this.editingItem.selectedSize) {
        basePrice = this.editingItem.selectedSize.price;
      }

      // Adiciona o preço da variação se houver
      if (this.editingItem.selectedVariation) {
        basePrice += this.editingItem.selectedVariation.price;
      }

      this.editingItem.price = basePrice;
    }
  }

  saveEditedItem(): void {
    if (this.editingItem && this.editingItemOriginal) {
      this._cartService.removeSpecificItem(this.editingItemOriginal);
      this._cartService.addItem(this.editingItem);
      this.closeEditModal();
    }
  }

  get isTableLinked(): boolean {
    return !!localStorage.getItem('tableId');
  }

  get tableLinkMessage(): string {
    return this.isTableLinked
      ? ''
      : 'Você precisa estar em uma mesa para fazer pedidos. Escaneie o QR Code da mesa.';
  }
}
