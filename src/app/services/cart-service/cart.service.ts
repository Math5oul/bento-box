import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  productName: string;
  price: number;
  quantity: number;
  observations?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'bento_cart_items';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
  cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();

  /**
   * Adiciona um novo item ao carrinho ou atualiza a quantidade caso ele já exista.
   * @param item O item a ser adicionado ou atualizado no carrinho.
   */
  addItem(item: CartItem): void {
    const currentItems = this.cartItemsSubject.value;
    const existingIndex = currentItems.findIndex(i => i.productName === item.productName);

    const newItems = [...currentItems];

    if (existingIndex > -1) {
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
    } else {
      newItems.push({ ...item });
    }

    this.cartItemsSubject.next(newItems);
    this.saveCartToStorage(newItems);
    console.log('CARRINHO:', newItems);
  }

  /**
   * Diminui a quantidade de um item no carrinho em 1 unidade.
   * Remove o item se a quantidade chegar a zero.
   * @param item Item a ter a quantidade reduzida.
   */
  decreaseQuantity(item: CartItem): void {
    const currentItems = [...this.cartItemsSubject.value];
    const index = currentItems.findIndex(i => i.productName === item.productName);

    if (index === -1) return;

    const updatedItem = {
      ...currentItems[index],
      quantity: currentItems[index].quantity - 1,
    };

    if (updatedItem.quantity <= 0) {
      this.removeItem(item.productName); // Remove se quantidade <= 0
    } else {
      currentItems[index] = updatedItem;
      this.cartItemsSubject.next(currentItems);
      this.saveCartToStorage(currentItems);
    }
  }

  /**
   * Aumenta a quantidade de um item no carrinho em 1 unidade.
   * @param productName Nome do produto a ter a quantidade aumentada.
   */
  increaseQuantity(productName: string): void {
    const currentItems = [...this.cartItemsSubject.value];
    const index = currentItems.findIndex(item => item.productName === productName);

    if (index === -1) return;

    const newItems = [...currentItems];
    newItems[index] = {
      ...newItems[index],
      quantity: newItems[index].quantity + 1,
    };

    this.cartItemsSubject.next(newItems);
    this.saveCartToStorage(newItems);
  }

  /**
   * Remove completamente um item do carrinho pelo nome do produto.
   * @param productName Nome do produto a ser removido.
   */
  removeItem(productName: string): void {
    const newItems = this.cartItemsSubject.value.filter(item => item.productName !== productName);
    this.cartItemsSubject.next(newItems);
    this.saveCartToStorage(newItems);
  }

  /**
   * Retorna Observable com os itens do carrinho
   * @returns Observable<CartItem[]>
   */
  getItems(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  /**
   * Retorna snapshot atual dos itens
   */
  getCurrentItems(): CartItem[] {
    return [...this.cartItemsSubject.value]; // Return a copy
  }

  /**
   * Calcula e retorna o valor total de todos os itens no carrinho.
   * @returns O valor total dos itens como um número.
   */
  getTotal(): number {
    return this.cartItemsSubject.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Limpa todos os itens do carrinho
   */
  clearCart(): void {
    this.cartItemsSubject.next([]);
    this.saveCartToStorage([]);
  }

  /**
   * Salva o carrinho no localStorage
   */
  private saveCartToStorage(items: CartItem[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
  }

  /**
   * Carrega o carrinho do localStorage
   */
  private loadCartFromStorage(): CartItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return [];
        }
      }
    }
    return [];
  }
}
