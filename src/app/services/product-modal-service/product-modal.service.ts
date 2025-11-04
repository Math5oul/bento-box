import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product, ProductVariation } from '../../interfaces';

export interface ProductModalData {
  images: string[];
  productName: string;
  price: number;
  description: string;
  sizes?: Array<{ name: string; abbreviation: string; price: number }>;
  variations?: ProductVariation[];
  onOrderSubmitted: (order: {
    productName: string;
    quantity: number;
    observations: string;
    selectedSize?: { name: string; abbreviation: string; price: number };
  }) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ProductModalService {
  private modalDataSubject = new BehaviorSubject<ProductModalData | null>(null);
  public modalData$ = this.modalDataSubject.asObservable();

  openModal(data: ProductModalData) {
    this.modalDataSubject.next(data);
  }

  closeModal() {
    this.modalDataSubject.next(null);
  }

  isOpen(): boolean {
    return this.modalDataSubject.value !== null;
  }
}
