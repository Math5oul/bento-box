import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'beverage' | 'food' | 'dessert' | 'other';
  format?: '1x1' | '1x2' | '2x1' | '2x2';
  colorMode?: 'light' | 'dark';
  available: boolean;
  gridPosition?: {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuResponse {
  success: boolean;
  data: {
    items: MenuItem[];
  };
}

export interface MenuItem {
  id: string;
  component: string;
  inputs: {
    format?: string;
    images: string[];
    colorMode?: string;
    productName: string;
    description: string;
    price: number;
  };
  colSpan: number;
  rowSpan: number;
  row: number;
  col: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  count: number;
}

export interface CategoryStats {
  _id: string;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface CategoriesResponse {
  success: boolean;
  data: CategoryStats[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  /**
   * Busca menu formatado para o grid
   */
  getMenu(): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(`${this.apiUrl}/menu`);
  }

  /**
   * Lista todos os produtos
   */
  getAllProducts(params?: {
    category?: string;
    available?: boolean;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(this.apiUrl, { params: params as any });
  }

  /**
   * Busca produto por ID
   */
  getProductById(id: string): Observable<{ success: boolean; data: Product }> {
    return this.http.get<{ success: boolean; data: Product }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Lista categorias com estatísticas
   */
  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`);
  }
}
