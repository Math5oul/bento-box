import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, BatchPositionUpdate } from '../../interfaces/product.interface';

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

export interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/products`;

  /**
   * Retorna headers com autenticação
   * Token enviado automaticamente via cookie httpOnly
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

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

  /**
   * Cria novo produto
   */
  createProduct(product: Partial<Product>): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, product, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Atualiza produto completo
   */
  updateProduct(id: string, product: Partial<Product>): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, product, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Atualiza apenas a posição do grid
   */
  updateProductPosition(
    id: string,
    position: { row: number; col: number; rowSpan: number; colSpan: number }
  ): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}/position`, position, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Atualiza posições de múltiplos produtos em lote
   */
  updateBatchPositions(products: BatchPositionUpdate[]): Observable<ProductsResponse> {
    return this.http.patch<ProductsResponse>(
      `${this.apiUrl}/batch/positions`,
      { products },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Deleta produto
   */
  deleteProduct(id: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
