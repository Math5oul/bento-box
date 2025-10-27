import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, forkJoin } from 'rxjs';
import { tap, map, catchError, take, switchMap } from 'rxjs/operators';
import { GridItem } from '../../interfaces/bento-box.interface';
import { ComponentRegistryService } from './component-registry.service';
import { environment } from '../../../environments/environment';
import { ProductService, BatchPositionUpdate } from '../product-service/product.service';

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
  success: boolean;
  data: {
    items: ServerMenuItem[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly API_URL = `${environment.apiUrl}/products/menu`;
  private productsSubject = new BehaviorSubject<GridItem[]>([]);

  constructor(
    private http: HttpClient,
    private componentRegistry: ComponentRegistryService,
    private productService: ProductService
  ) {
    this.loadFromServer();
  }

  private loadFromServer(): void {
    this.http
      .get<ServerResponse>(this.API_URL)
      .pipe(
        map(response => {
          const data = response.data;
          if (!data?.items || !Array.isArray(data.items)) {
            console.warn('No items found in server response');
            return [];
          }
          return data.items.map((item: ServerMenuItem) => {
            const componentName =
              typeof item.component === 'string' ? item.component : String(item.component);

            const componentType = this.componentRegistry.getComponent(componentName);

            if (!componentType) {
              console.error(`Component not found in registry: ${componentName}`);
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

  /**
   * Salva as posições dos produtos usando batch update
   */
  saveProducts(products: GridItem[]): Observable<any> {
    const batchUpdates: BatchPositionUpdate[] = products.map(item => ({
      id: String(item.id),
      row: item.row,
      col: item.col,
      rowSpan: item.rowSpan,
      colSpan: item.colSpan,
    }));

    console.log('📤 Salvando posições de', batchUpdates.length, 'produtos...');

    return this.productService.updateBatchPositions(batchUpdates).pipe(
      tap(() => {
        console.log('✅ Posições salvas no MongoDB com sucesso');
        this.productsSubject.next(products);
      }),
      catchError(error => {
        console.error('❌ Erro ao salvar posições:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Atualiza um produto existente
   */
  updateProduct(id: string, productData: any): Observable<any> {
    console.log('📝 Atualizando produto', id, productData);

    const apiData: any = {
      name: productData.productName || productData.name,
      description: productData.description,
      price: productData.price,
      images: productData.images || [],
      format: productData.format || '1x1',
      colorMode: productData.colorMode || 'light',
      available: productData.available !== undefined ? productData.available : true,
    };

    if (productData.row !== undefined) {
      apiData.gridPosition = {
        row: productData.row,
        col: productData.col,
        rowSpan: productData.rowSpan || 1,
        colSpan: productData.colSpan || 1,
      };
    }

    return this.productService.updateProduct(id, apiData).pipe(
      tap(() => {
        console.log('✅ Produto atualizado com sucesso');
        this.loadFromServer();
      }),
      catchError(error => {
        console.error('❌ Erro ao atualizar produto:', error);
        return throwError(() => error);
      })
    );
  }

  createProduct(productData: any): Observable<any> {
    return this.productService.createProduct(productData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.productService.deleteProduct(id).pipe(
      tap(() => {
        this.loadFromServer();
      })
    );
  }

  saveProducts_OLD(products: any[]): Observable<any> {
    return this.http.post(this.API_URL, { items: products }).pipe(
      tap(() => {
        console.log('✅ Dados salvos no servidor com sucesso');
      }),
      catchError(error => {
        console.error('Error saving products:', error);
        return throwError(() => error);
      })
    );
  }

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

  /**
   * Faz upload de imagens para um produto específico
   */
  uploadProductImages(productId: string, files: File[]): Observable<any> {
    console.log('📤 uploadProductImages chamado');
    console.log('  - productId:', productId);
    console.log('  - Número de arquivos:', files.length);
    console.log('  - URL:', `${environment.apiUrl}/upload/${productId}`);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
      console.log('  - Adicionado arquivo:', file.name, file.type, file.size);
    });

    return this.http.post(`${environment.apiUrl}/upload/${productId}`, formData).pipe(
      tap(response => {
        console.log('✅ Resposta do upload:', response);
      }),
      catchError(error => {
        console.error('❌ Error uploading images:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Deleta produto e sua pasta de imagens
   */
  deleteProductWithImages(productId: string): Observable<any> {
    const url = `${environment.apiUrl}/upload/product/${productId}`;
    console.log('🔗 Fazendo DELETE para:', url);

    return this.http.delete(url).pipe(
      tap(response => {
        console.log(`✅ Produto ${productId} e suas imagens deletados. Resposta:`, response);
      }),
      catchError(error => {
        console.error('❌ Error deleting product:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Renomeia pasta de imagens ao confirmar criação de produto
   */
  renameProductFolder(tempId: string, newId: string): Observable<{ newPaths: string[] }> {
    const url = `${environment.apiUrl}/upload/${tempId}/rename/${newId}`;
    console.log('🔄 Renomeando pasta de', tempId, 'para', newId);

    return this.http.post<{ success: boolean; newPaths: string[] }>(url, {}).pipe(
      map(response => ({ newPaths: response.newPaths || [] })),
      catchError(error => {
        console.error('❌ Erro ao renomear pasta:', error);
        return of({ newPaths: [] });
      })
    );
  }

  deleteImage(imagePath: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/upload/image`, { body: { imagePath } }).pipe(
      catchError(error => {
        console.error('Error deleting image:', error);
        return throwError(() => error);
      })
    );
  }
}
