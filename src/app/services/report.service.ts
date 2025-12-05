import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReportCategory, SalesReport, ReportFilters } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Retorna headers com token de autenticação
   */
  private getHeaders(): HttpHeaders {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('auth_token') : null;
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /**
   * Listar todas as categorias de relatório
   */
  getCategories(): Observable<{ categories: ReportCategory[] }> {
    const headers = this.getHeaders();
    return this.http.get<{ categories: ReportCategory[] }>(`${this.apiUrl}/categories`, {
      headers,
    });
  }

  /**
   * Criar nova categoria de relatório
   */
  createCategory(category: Partial<ReportCategory>): Observable<{ category: ReportCategory }> {
    const headers = this.getHeaders();
    return this.http.post<{ category: ReportCategory }>(`${this.apiUrl}/categories`, category, {
      headers,
    });
  }

  /**
   * Atualizar categoria de relatório
   */
  updateCategory(
    id: string,
    category: Partial<ReportCategory>
  ): Observable<{ category: ReportCategory }> {
    const headers = this.getHeaders();
    return this.http.put<{ category: ReportCategory }>(
      `${this.apiUrl}/categories/${id}`,
      category,
      { headers }
    );
  }

  /**
   * Deletar categoria de relatório
   */
  deleteCategory(id: string): Observable<{ message: string }> {
    const headers = this.getHeaders();
    return this.http.delete<{ message: string }>(`${this.apiUrl}/categories/${id}`, { headers });
  }

  /**
   * Gerar relatório de vendas com filtros
   */
  generateSalesReport(filters: ReportFilters): Observable<SalesReport> {
    const headers = this.getHeaders();
    return this.http.post<SalesReport>(`${this.apiUrl}/sales`, filters, { headers });
  }

  /**
   * Atribuir produtos a uma categoria
   */
  assignProductsToCategory(
    categoryId: string,
    productIds: string[]
  ): Observable<{ category: ReportCategory }> {
    return this.updateCategory(categoryId, { productIds });
  }

  /**
   * Remover produto de uma categoria
   */
  removeProductFromCategory(
    categoryId: string,
    productId: string
  ): Observable<{ category: ReportCategory }> {
    const headers = this.getHeaders();
    return this.http
      .get<{ categories: ReportCategory[] }>(`${this.apiUrl}/categories`, { headers })
      .pipe(
        // Primeiro buscar a categoria
        switchMap(response => {
          const category = response.categories.find(cat => cat._id === categoryId);
          if (!category) {
            throw new Error('Categoria não encontrada');
          }

          // Remover o produto da lista
          const updatedProductIds = category.productIds.filter(id => id !== productId);

          // Atualizar a categoria
          return this.updateCategory(categoryId, { productIds: updatedProductIds });
        })
      );
  }

  /**
   * Obter relatório resumido (últimos 30 dias)
   */
  getQuickReport(): Observable<SalesReport> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const filters: ReportFilters = {
      startDate: startDate,
      endDate: endDate,
    };

    return this.generateSalesReport(filters);
  }

  /**
   * Exportar relatório para CSV
   */
  exportToCsv(report: SalesReport): void {
    const rows: string[][] = [];

    // Header
    rows.push(['Tipo', 'Nome', 'Quantidade', 'Receita', 'Percentual']);

    // Vendas por categoria
    report.salesByCategory.forEach(cat => {
      rows.push([
        'Categoria',
        cat.categoryName,
        cat.quantity.toString(),
        `R$ ${cat.revenue.toFixed(2)}`,
        `${cat.percentage.toFixed(2)}%`,
      ]);
    });

    // Vendas por produto
    report.salesByProduct.forEach(prod => {
      rows.push([
        'Produto',
        prod.productName,
        prod.quantity.toString(),
        `R$ ${prod.revenue.toFixed(2)}`,
        '-',
      ]);
    });

    // Converter para CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Formatar número como moeda brasileira
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Formatar data para exibição
   */
  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }
}
