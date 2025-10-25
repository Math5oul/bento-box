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

  /**
   * Salva as posições dos produtos no MongoDB
   * Usa a API de batch update para atualizar múltiplos produtos de uma vez
   */
  saveProducts(products: GridItem[]): Observable<any> {
    // Prepara os dados para batch update
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
        // Atualiza o subject local
        this.productsSubject.next(products);
      }),
      catchError(error => {
        console.error('❌ Erro ao salvar posições:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Atualiza um único produto (usado para edições)
   */
  updateProduct(id: string, productData: any): Observable<any> {
    console.log('📝 Atualizando produto', id, productData);

    // Converte os dados do formato do grid para o formato da API
    const apiData: any = {
      name: productData.productName || productData.name,
      description: productData.description,
      price: productData.price,
      images: productData.images || [],
      format: productData.format || '1x1',
      colorMode: productData.colorMode || 'light',
      available: productData.available !== undefined ? productData.available : true,
    };

    // Adiciona gridPosition se fornecido
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
        // Recarrega os produtos do servidor
        this.loadFromServer();
      }),
      catchError(error => {
        console.error('❌ Erro ao atualizar produto:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cria um novo produto
   */
  createProduct(productData: any): Observable<any> {
    return this.productService.createProduct(productData);
  }

  /**
   * Deleta um produto
   */
  deleteProduct(id: string): Observable<any> {
    return this.productService.deleteProduct(id).pipe(
      tap(() => {
        // Recarrega os produtos do servidor
        this.loadFromServer();
      })
    );
  }

  saveProducts_OLD(products: any[]): Observable<any> {
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

  // Upload de imagens para um produto
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

  // Deletar produto e sua pasta de imagens
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

  // Renomear pasta de imagens de ID temporário para ID definitivo
  renameProductFolder(tempId: string, newId: string): Observable<{ newPaths: string[] }> {
    const url = `${environment.apiUrl}/upload/${tempId}/rename/${newId}`;
    console.log('🔄 Renomeando pasta de', tempId, 'para', newId);

    return this.http.post<{ success: boolean; newPaths: string[] }>(url, {}).pipe(
      map(response => ({ newPaths: response.newPaths || [] })),
      catchError(error => {
        console.error('❌ Erro ao renomear pasta:', error);
        // Retorna vazio em caso de erro (pasta pode não existir)
        return of({ newPaths: [] });
      })
    );
  }

  // Deletar uma imagem específica
  deleteImage(imagePath: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/upload/image`, { body: { imagePath } }).pipe(
      catchError(error => {
        console.error('Error deleting image:', error);
        return throwError(() => error);
      })
    );
  }
}
