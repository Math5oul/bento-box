import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, map, catchError, take } from 'rxjs/operators';
import { GridItem } from '../../interfaces/bento-box.interface';
import { ComponentRegistryService } from '../component-registry.service';
import { environment } from '../../../environments/environment';

// Server response interface for proper typing
interface ServerMenuItem {
  id: number;
  component: string;
  inputs: any;
  colSpan: number;
  rowSpan: number;
  row: number;
  col: number;
}

interface ServerResponse {
  items: ServerMenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly API_URL = `${environment.apiUrl}/api/menu`;
  private productsSubject = new BehaviorSubject<GridItem[]>([]);

  constructor(
    private http: HttpClient,
    private componentRegistry: ComponentRegistryService
  ) {
    this.loadFromServer();
  }

  private loadFromServer(): void {
    this.http.get<ServerResponse>(this.API_URL).pipe(
      map(data => {
        if (!data.items || !Array.isArray(data.items)) {
          console.warn('No items found in server response');
          return [];
        }
        return data.items.map(item => {
          // Validate that component is a string before passing to registry
          const componentName = typeof item.component === 'string'
            ? item.component
            : String(item.component);

          return {
            ...item,
            component: this.componentRegistry.getComponent(componentName)
          } as GridItem;
        });
      }),
      catchError(error => {
        console.error('Error loading products from server:', error);
        // Return empty array to allow app to recover gracefully
        return of([]);
      }),
      take(1) // Ensure subscription completes after first emission
    ).subscribe(items => {
      this.productsSubject.next(items);
    });
  }

  getProducts(): Observable<GridItem[]> {
    return this.productsSubject.asObservable();
  }

  saveProducts(products: GridItem[]): Observable<any> {
    return this.http.post(this.API_URL, { items: products }).pipe(
      tap(() => {
        // Update the subject only after successful save
        this.productsSubject.next(products);
      }),
      catchError(error => {
        console.error('Error saving products:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos auxiliares se quiser manter a API
  addProduct(product: GridItem): Observable<any> {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = [...currentProducts, product];
    return this.saveProducts(updatedProducts);
  }

  removeProduct(productId: number): Observable<any> {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.filter(p => p.id !== productId);
    return this.saveProducts(updatedProducts);
  }

  clearStorage(): Observable<any> {
    return this.saveProducts([]);
  }
}
