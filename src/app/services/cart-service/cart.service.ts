import { Injectable } from "@angular/core";

export interface CartItem {
  productName: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: "root" })
export class CartService {
  private items: CartItem[] = [];

  /**
   * Adiciona um novo item ao carrinho ou atualiza a quantidade caso ele já exista.
   * @param item O item a ser adicionado ou atualizado no carrinho.
   */
  addItem(item: CartItem): void {
    const existing = this.items.find((i) => i.productName === item.productName);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
    console.log("CARRINHO:", this.getItems());
  }

  /**
   * Retorna todos os itens atualmente presentes no carrinho.
   * @returns Um array com os itens do carrinho.
   */
  getItems(): CartItem[] {
    return this.items;
  }

  /**
   * Calcula e retorna o valor total de todos os itens no carrinho.
   * @returns O valor total dos itens como um número.
   */
  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}
