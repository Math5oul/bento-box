import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, map, catchError, take } from 'rxjs/operators';
import { GridItem } from '../../interfaces/bento-box.interface';
import { ComponentRegistryService } from './component-registry.service';
import { environment } from '../../../environments/environment';

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
  providedIn: 'root',
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
    this.http
      .get<ServerResponse>(this.API_URL)
      .pipe(
        map(data => {
          if (!data.items || !Array.isArray(data.items)) {
            console.warn('No items found in server response');
            return [];
          }
          return data.items.map(item => {
            // Valida e converte o componente de string para Type
            const componentName =
              typeof item.component === 'string' ? item.component : String(item.component);

            const componentType = this.componentRegistry.getComponent(componentName);

            if (!componentType) {
              console.error(`Component not found in registry: ${componentName}`);
              // Fallback para um componente padrão, se necessário
              return {
                ...item,
                component: this.componentRegistry.getComponent('SimpleProductComponent'),
              } as GridItem;
            }

            return {
              ...item,
              component: componentType,
            } as GridItem;
          });
        }),
        catchError(error => {
          console.error('Error loading products from server:', error);
          // Returna vazio em caso de erro
          return of([]);
        }),
        take(1)
      )
      .subscribe(items => {
        this.productsSubject.next(items);
      });
  }

  getProducts(): Observable<GridItem[]> {
    return this.productsSubject.asObservable();
  }

  saveProducts(products: any[]): Observable<any> {
    // products aqui são dados preparados com component como string
    return this.http.post(this.API_URL, { items: products }).pipe(
      tap(() => {
        // Não atualiza o subject aqui - os dados já estão atualizados no array original
        // que está sendo observado pelo componente
        console.log('✅ Dados salvos no servidor com sucesso');
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
