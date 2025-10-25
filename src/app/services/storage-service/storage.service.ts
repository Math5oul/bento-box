import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GridItem } from '../../interfaces/bento-box.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'bento_products';
  private productsSubject = new BehaviorSubject<GridItem[]>([]);

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.productsSubject.next(JSON.parse(stored));
    }
  }

  getProducts(): Observable<any[]> {
    return this.productsSubject.asObservable();
  }

  saveProducts(products: any[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    this.productsSubject.next(products);
  }

  addProduct(product: any): void {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = [...currentProducts, product];
    this.saveProducts(updatedProducts);
  }

  removeProduct(productId: number): void {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.filter(p => p.id !== productId);
    this.saveProducts(updatedProducts);
  }

  clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.productsSubject.next([]);
  }
}
