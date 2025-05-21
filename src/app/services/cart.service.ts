import { Injectable } from "@angular/core";

export interface CartItem {
  productName: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: "root" })
export class CartService {
  private items: CartItem[] = [];

  addItem(item: CartItem) {
    const existing = this.items.find((i) => i.productName === item.productName);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }

  getItems(): CartItem[] {
    return this.items;
  }

  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}
