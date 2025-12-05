import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/categories`;

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  /**
   * Headers com autenticação
   */
  private getHeaders(): HttpHeaders {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('auth_token') : null;
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /**
   * Lista todas as categorias
   */
  getCategories(): Observable<{ success: boolean; data: Category[]; count: number }> {
    return this.http
      .get<{ success: boolean; data: Category[]; count: number }>(this.apiUrl, {
        headers: this.getHeaders(),
      })
      .pipe(
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
    return this.http.get<{ success: boolean; data: Category }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Cria nova categoria
   */
  createCategory(
    category: CreateCategoryDTO
  ): Observable<{ success: boolean; data: Category; message: string }> {
    return this.http
      .post<{ success: boolean; data: Category; message: string }>(this.apiUrl, category, {
        headers: this.getHeaders(),
      })
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
      .put<{ success: boolean; data: Category; message: string }>(
        `${this.apiUrl}/${id}`,
        category,
        {
          headers: this.getHeaders(),
        }
      )
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
      .delete<{ success: boolean; data: Category; message: string }>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
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

  /**
   * Atualiza descontos de uma categoria
   */
  updateDiscounts(
    categoryId: string,
    discounts: { roleId: string; discountPercent: number }[]
  ): Observable<{ success: boolean; data: Category; message: string }> {
    return this.http
      .put<{
        success: boolean;
        data: Category;
        message: string;
      }>(`${this.apiUrl}/${categoryId}/discounts`, { discounts })
      .pipe(
        tap(response => {
          if (response.success) {
            // Recarrega a lista de categorias
            this.getCategories().subscribe();
          }
        })
      );
  }
}
