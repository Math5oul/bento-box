import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '../../interfaces/category.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  /**
   * Lista todas as categorias
   */
  getCategories(): Observable<{ success: boolean; data: Category[]; count: number }> {
    return this.http.get<{ success: boolean; data: Category[]; count: number }>(this.apiUrl).pipe(
      tap(response => {
        if (response.success) {
          this.categoriesSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Busca categoria por ID
   */
  getCategoryById(id: string): Observable<{ success: boolean; data: Category }> {
    return this.http.get<{ success: boolean; data: Category }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria nova categoria
   */
  createCategory(
    category: CreateCategoryDTO
  ): Observable<{ success: boolean; data: Category; message: string }> {
    return this.http
      .post<{ success: boolean; data: Category; message: string }>(this.apiUrl, category)
      .pipe(
        tap(response => {
          if (response.success) {
            // Recarrega a lista de categorias
            this.getCategories().subscribe();
          }
        })
      );
  }

  /**
   * Atualiza categoria existente (renomear)
   */
  updateCategory(
    id: string,
    category: UpdateCategoryDTO
  ): Observable<{ success: boolean; data: Category; message: string }> {
    return this.http
      .put<{ success: boolean; data: Category; message: string }>(`${this.apiUrl}/${id}`, category)
      .pipe(
        tap(response => {
          if (response.success) {
            // Recarrega a lista de categorias
            this.getCategories().subscribe();
          }
        })
      );
  }

  /**
   * Deleta categoria
   */
  deleteCategory(id: string): Observable<{ success: boolean; data: Category; message: string }> {
    return this.http
      .delete<{ success: boolean; data: Category; message: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          if (response.success) {
            // Recarrega a lista de categorias
            this.getCategories().subscribe();
          }
        })
      );
  }

  /**
   * Retorna as categorias atuais do cache
   */
  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }
}
