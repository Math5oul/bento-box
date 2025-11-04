import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product, ProductVariation } from '../../interfaces';

export interface CartItemSize {
  name: string;
  abbreviation: string;
  price: number;
}

export interface CartItem {
  productName: string;
  price: number;
  quantity: number;
  observations?: string;
  image?: string;
  selectedSize?: CartItemSize;
  totalSizes?: number;
  selectedVariation?: ProductVariation;
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

    // Encontra item existente com mesmo produto, mesmo tamanho E mesma variação
    const existingIndex = currentItems.findIndex(
      i =>
        i.productName === item.productName &&
        this.areSizesEqual(i.selectedSize, item.selectedSize) &&
        this.areVariationsEqual(i.selectedVariation, item.selectedVariation)
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
    this.saveCartToStorage(newItems);
    console.log('CARRINHO:', newItems);
  }

  /**
   * Verifica se dois tamanhos são iguais
   */
  private areSizesEqual(size1?: CartItemSize, size2?: CartItemSize): boolean {
    if (!size1 && !size2) return true;
    if (!size1 || !size2) return false;
    return size1.name === size2.name && size1.abbreviation === size2.abbreviation;
  }

  /**
   * Verifica se duas variações são iguais
   */
  private areVariationsEqual(
    variation1?: ProductVariation,
    variation2?: ProductVariation
  ): boolean {
    if (!variation1 && !variation2) return true;
    if (!variation1 || !variation2) return false;
    return variation1.title === variation2.title;
  }

  /**
   * Diminui a quantidade de um item no carrinho em 1 unidade.
   * Remove o item se a quantidade chegar a zero.
   * @param item Item a ter a quantidade reduzida.
   */
  decreaseQuantity(item: CartItem): void {
    const currentItems = [...this.cartItemsSubject.value];
    const index = currentItems.findIndex(
      i =>
        i.productName === item.productName &&
        this.areSizesEqual(i.selectedSize, item.selectedSize) &&
        this.areVariationsEqual(i.selectedVariation, item.selectedVariation)
    );

    if (index === -1) return;

    const updatedItem = {
      ...currentItems[index],
      quantity: currentItems[index].quantity - 1,
    };

    if (updatedItem.quantity <= 0) {
      this.removeSpecificItem(item); // Remove se quantidade <= 0
    } else {
      currentItems[index] = updatedItem;
      this.cartItemsSubject.next(currentItems);
      this.saveCartToStorage(currentItems);
    }
  }

  /**
   * Aumenta a quantidade de um item no carrinho em 1 unidade.
   * @param item Item a ter a quantidade aumentada.
   */
  increaseQuantity(item: CartItem): void {
    const currentItems = [...this.cartItemsSubject.value];
    const index = currentItems.findIndex(
      i =>
        i.productName === item.productName &&
        this.areSizesEqual(i.selectedSize, item.selectedSize) &&
        this.areVariationsEqual(i.selectedVariation, item.selectedVariation)
    );

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
   * Remove um item específico do carrinho (considerando produto, tamanho e variação)
   * @param item Item a ser removido
   */
  removeSpecificItem(item: CartItem): void {
    const newItems = this.cartItemsSubject.value.filter(
      i =>
        !(
          i.productName === item.productName &&
          this.areSizesEqual(i.selectedSize, item.selectedSize) &&
          this.areVariationsEqual(i.selectedVariation, item.selectedVariation)
        )
    );
    this.cartItemsSubject.next(newItems);
    this.saveCartToStorage(newItems);
  }

  /**
   * Atualiza um item existente no carrinho
   * @param oldItem Item antigo a ser substituído
   * @param newItem Novo item com as alterações
   */
  updateItem(oldItem: CartItem, newItem: CartItem): void {
    const currentItems = this.cartItemsSubject.value;
    const index = currentItems.findIndex(
      i =>
        i.productName === oldItem.productName &&
        this.areSizesEqual(i.selectedSize, oldItem.selectedSize) &&
        this.areVariationsEqual(i.selectedVariation, oldItem.selectedVariation)
    );

    if (index > -1) {
      const newItems = [...currentItems];
      newItems[index] = { ...newItem };
      this.cartItemsSubject.next(newItems);
      this.saveCartToStorage(newItems);
    }
  }

  /**
   * Encontra um item específico no carrinho
   * @param item Item a ser encontrado
   */
  findItem(item: CartItem): CartItem | undefined {
    return this.cartItemsSubject.value.find(
      i =>
        i.productName === item.productName &&
        this.areSizesEqual(i.selectedSize, item.selectedSize) &&
        this.areVariationsEqual(i.selectedVariation, item.selectedVariation)
    );
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
