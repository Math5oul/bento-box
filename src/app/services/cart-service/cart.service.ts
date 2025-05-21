import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  productName: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();

  /**
   * Adiciona um novo item ao carrinho ou atualiza a quantidade caso ele já exista.
   * @param item O item a ser adicionado ou atualizado no carrinho.
   */
  addItem(item: CartItem): void {
    const currentItems = this.cartItemsSubject.value;
    const existingIndex = currentItems.findIndex(
      (i) => i.productName === item.productName
    );

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
    console.log('CARRINHO:', newItems);
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
    return this.cartItemsSubject.value.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}
