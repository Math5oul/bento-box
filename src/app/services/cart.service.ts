import { Injectable } from "@angular/core";

// This interface defines the structure of a cart item
export interface CartItem {
  productName: string;
  price: number;
  quantity: number;
}

// This decorator makes the service available throughout the app
@Injectable({ providedIn: "root" })
export class CartService {
  // This array will store all items added to the cart
  private items: CartItem[] = [];

  // This method adds a new item to the cart or updates the quantity if it already exists
  addItem(item: CartItem) {
    const existing = this.items.find((i) => i.productName === item.productName);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }

  // This method returns all items currently in the cart
  getItems(): CartItem[] {
    return this.items;
  }

  // This method calculates and returns the total price of all items in the cart
  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}
