import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReportCategory, SalesReport, ReportFilters } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';

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
   * Exportar relatório para Excel com formatação de tabela
   */
  exportToCsv(report: SalesReport): void {
    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Criar dados para a planilha de resumo
    const summaryData: any[] = [
      ['RESUMO DO RELATÓRIO'],
      [],
      ['Receita Total', `R$ ${report.totalRevenue.toFixed(2)}`],
      ['Total de Vendas', report.totalSales.toString()],
      [],
    ];

    // Dados por categoria
    const categoryData: any[] = [
      ['VENDAS POR CATEGORIA FISCAL'],
      [],
      ['Categoria', 'Quantidade', 'Receita', 'Percentual'],
    ];

    report.salesByCategory.forEach(cat => {
      categoryData.push([
        cat.categoryName,
        Math.round(cat.quantity),
        cat.revenue,
        `${cat.percentage.toFixed(2)}%`,
      ]);
    });

    // Dados por produto
    const productData: any[] = [
      [],
      ['PRODUTOS MAIS VENDIDOS'],
      [],
      ['Produto', 'Quantidade', 'Receita', 'Preço Médio'],
    ];

    report.salesByProduct.forEach(prod => {
      productData.push([
        prod.productName,
        Math.round(prod.quantity),
        prod.revenue,
        prod.averagePrice,
      ]);
    });

    // Dados por método de pagamento
    const paymentData: any[] = [
      [],
      ['VENDAS POR MÉTODO DE PAGAMENTO'],
      [],
      ['Método', 'Quantidade', 'Receita', 'Percentual'],
    ];

    if (report.salesByPaymentMethod && report.salesByPaymentMethod.length > 0) {
      report.salesByPaymentMethod.forEach(payment => {
        paymentData.push([
          this.getPaymentMethodLabel(payment.method),
          payment.count,
          payment.revenue,
          `${payment.percentage.toFixed(2)}%`,
        ]);
      });
    }

    // Combinar todos os dados
    const allData = [...summaryData, ...categoryData, ...productData, ...paymentData];

    // Converter para worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Definir largura das colunas
    ws['!cols'] = [
      { wch: 30 }, // Coluna A - Nome/Tipo
      { wch: 15 }, // Coluna B - Quantidade
      { wch: 15 }, // Coluna C - Receita
      { wch: 15 }, // Coluna D - Percentual/Preço
    ];

    // Formatar células de valores monetários
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        const cell = ws[cellAddress];

        // Formatar valores monetários (coluna C - índice 2)
        if (C === 2 && typeof cell.v === 'number' && R > 2) {
          cell.z = 'R$ #,##0.00';
        }

        // Formatar preço médio (coluna D - índice 3 na seção de produtos)
        if (C === 3 && typeof cell.v === 'number' && R > 2) {
          cell.z = 'R$ #,##0.00';
        }
      }
    }

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Vendas');

    // Gerar arquivo Excel
    const fileName = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Obter label do método de pagamento
   */
  private getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      other: 'Outro',
    };
    return labels[method] || method;
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
