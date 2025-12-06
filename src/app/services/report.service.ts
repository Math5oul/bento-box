import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReportCategory, SalesReport, ReportFilters } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
   * Token enviado automaticamente via cookie httpOnly
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
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
    // Criar workbook ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Vendas');

    // Função para estilizar título e mesclar
    function styleTitle(row: ExcelJS.Row, worksheet: ExcelJS.Worksheet) {
      row.font = { bold: true, size: 14 };
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }, // cinza claro
        };
      });
      // Mesclar as 4 colunas do título
      worksheet.mergeCells(`A${row.number}:D${row.number}`);
    }

    // Função para estilizar cabeçalho
    function styleHeader(row: ExcelJS.Row) {
      row.font = { bold: true };
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }, // verde claro
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }

    // Função para aplicar borda fina em uma área de tabela
    function addTableBorders(
      worksheet: ExcelJS.Worksheet,
      startRow: number,
      endRow: number,
      colCount: number = 4
    ) {
      for (let r = startRow; r <= endRow; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= colCount; c++) {
          const cell = row.getCell(c);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }
      }
    }

    // Adicionar dados de resumo
    let row = worksheet.addRow(['RESUMO DO RELATÓRIO']);
    styleTitle(row, worksheet);
    worksheet.addRow([]);
    const receitaRow = worksheet.addRow(['Receita Total', `R$ ${report.totalRevenue.toFixed(2)}`]);
    const vendasRow = worksheet.addRow(['Total de Vendas', report.totalSales.toString()]);
    // Adicionar borda fina nessas duas linhas
    [receitaRow, vendasRow].forEach(row => {
      for (let c = 1; c <= 4; c++) {
        row.getCell(c).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        // Alinhar à direita as colunas C e D
        if (c === 3 || c === 4) {
          row.getCell(c).alignment = { horizontal: 'right' };
        }
      }
    });
    worksheet.addRow([]);

    // Vendas por categoria
    const catTitleRow = worksheet.addRow(['VENDAS POR CATEGORIA FISCAL']);
    styleTitle(catTitleRow, worksheet);
    worksheet.addRow([]);
    const catHeaderRow = worksheet.addRow(['Categoria', 'Quantidade', 'Receita', 'Percentual']);
    styleHeader(catHeaderRow);
    const catStart = catHeaderRow.number + 1;
    report.salesByCategory.forEach(cat => {
      worksheet.addRow([
        cat.categoryName,
        Math.round(cat.quantity),
        cat.revenue,
        `${cat.percentage.toFixed(2)}%`,
      ]);
    });
    const catEnd = worksheet.lastRow ? worksheet.lastRow.number : catHeaderRow.number;
    addTableBorders(worksheet, catHeaderRow.number, catEnd);

    worksheet.addRow([]);
    // VENDAS POR MÉTODO DE PAGAMENTO (agora acima dos produtos)
    const payTitleRow = worksheet.addRow(['VENDAS POR MÉTODO DE PAGAMENTO']);
    styleTitle(payTitleRow, worksheet);
    worksheet.addRow([]);
    const payHeaderRow = worksheet.addRow(['Método', 'Quantidade', 'Receita', 'Percentual']);
    styleHeader(payHeaderRow);
    const payStart = payHeaderRow.number + 1;
    if (report.salesByPaymentMethod && report.salesByPaymentMethod.length > 0) {
      report.salesByPaymentMethod.forEach(payment => {
        worksheet.addRow([
          this.getPaymentMethodLabel(payment.method),
          payment.count,
          payment.revenue,
          `${payment.percentage.toFixed(2)}%`,
        ]);
      });
    }
    const payEnd = worksheet.lastRow ? worksheet.lastRow.number : payHeaderRow.number;
    addTableBorders(worksheet, payHeaderRow.number, payEnd);

    worksheet.addRow([]);
    // PRODUTOS VENDIDOS (agora depois de métodos de pagamento)
    const prodTitleRow = worksheet.addRow(['PRODUTOS VENDIDOS']);
    styleTitle(prodTitleRow, worksheet);
    worksheet.addRow([]);
    const prodHeaderRow = worksheet.addRow(['Produto', 'Quantidade', 'Receita', 'Preço Médio']);
    styleHeader(prodHeaderRow);
    const prodStart = prodHeaderRow.number + 1;
    // Listar todos os produtos vendidos
    report.salesByProduct.forEach(prod => {
      worksheet.addRow([
        prod.productName,
        Math.round(prod.quantity),
        prod.revenue,
        prod.averagePrice,
      ]);
    });
    const prodEnd = worksheet.lastRow ? worksheet.lastRow.number : prodHeaderRow.number;
    addTableBorders(worksheet, prodHeaderRow.number, prodEnd);

    // Definir largura das colunas
    worksheet.columns = [{ width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }];

    // Formatar valores monetários (coluna C e D)
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if ((colNumber === 3 || colNumber === 4) && typeof cell.value === 'number') {
          cell.numFmt = 'R$ #,##0.00';
        }
      });
    });

    // Gerar arquivo Excel
    const fileName = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xlsx`;
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, fileName);
    });
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
