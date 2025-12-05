import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { ProductService } from '../../../services/product-service/product.service';
import { Product } from '../../../interfaces/product.interface';
import {
  ReportCategory,
  SalesReport,
  ReportFilters,
  CategorySalesData,
  ProductSalesData,
} from '../../../interfaces/report.interface';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  // Controle de abas
  activeTab: 'categories' | 'sales' | 'analysis' = 'sales';

  // Categorias
  categories: ReportCategory[] = [];
  selectedCategory: ReportCategory | null = null;
  categoryForm: FormGroup;
  isEditingCategory = false;
  showCategoryModal = false;

  // Produtos
  allProducts: Product[] = [];
  showProductsModal = false;
  selectedCategoryForProducts: ReportCategory | null = null;
  productSearchTerm = '';

  // Relatórios
  salesReport: SalesReport | null = null;
  reportForm: FormGroup;
  isLoadingReport = false;
  showAllProducts = false; // Controle para expandir/recolher lista de produtos

  // Estados de carregamento e erro
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  // Dados da tabela CSV
  csvTableData: any[] = [];
  showCsvTable = false;

  // Lista de métodos de pagamento disponíveis
  availablePaymentMethods = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'other', label: 'Outro' },
  ];

  constructor(
    private reportService: ReportService,
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    // Form para criar/editar categorias
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      color: ['#3b82f6', Validators.required],
    });

    // Form para filtros de relatório - Período padrão: últimos 30 dias
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    // Selecionar todos os métodos de pagamento por padrão
    const allPaymentMethods = this.availablePaymentMethods.map(method => method.value);

    this.reportForm = this.fb.group({
      startDate: [this.formatDateForInput(oneMonthAgo), Validators.required],
      endDate: [this.formatDateForInput(today), Validators.required],
      categoryIds: [[]],
      productIds: [[]],
      paymentMethods: [allPaymentMethods],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  /**
   * Carregar categorias de relatório
   */
  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

    this.reportService.getCategories().subscribe({
      next: response => {
        this.categories = response.categories;
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erro ao carregar categorias';
        console.error('Erro ao carregar categorias:', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Trocar aba ativa
   */
  setActiveTab(tab: 'categories' | 'sales' | 'analysis'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  /**
   * Abrir modal para criar nova categoria
   */
  openCreateCategoryModal(): void {
    this.isEditingCategory = false;
    this.selectedCategory = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      color: '#3b82f6',
    });
    this.showCategoryModal = true;
  }

  /**
   * Abrir modal para editar categoria
   */
  openEditCategoryModal(category: ReportCategory): void {
    this.isEditingCategory = true;
    this.selectedCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
    });
    this.showCategoryModal = true;
  }

  /**
   * Fechar modal de categoria
   */
  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.selectedCategory = null;
    this.categoryForm.reset();
  }

  /**
   * Salvar categoria (criar ou editar)
   */
  saveCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const categoryData = this.categoryForm.value;

    const request =
      this.isEditingCategory && this.selectedCategory
        ? this.reportService.updateCategory(this.selectedCategory._id, categoryData)
        : this.reportService.createCategory(categoryData);

    request.subscribe({
      next: () => {
        this.success = `Categoria ${this.isEditingCategory ? 'atualizada' : 'criada'} com sucesso!`;
        this.closeCategoryModal();
        this.loadCategories();
        this.isLoading = false;
      },
      error: err => {
        this.error = err.error?.error || 'Erro ao salvar categoria';
        console.error('Erro ao salvar categoria:', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Deletar categoria
   */
  deleteCategory(category: ReportCategory): void {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${category.name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.reportService.deleteCategory(category._id).subscribe({
      next: () => {
        this.success = 'Categoria deletada com sucesso!';
        this.loadCategories();
        this.isLoading = false;
      },
      error: err => {
        this.error = err.error?.error || 'Erro ao deletar categoria';
        console.error('Erro ao deletar categoria:', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Gerar relatório de vendas
   */
  generateReport(): void {
    if (this.reportForm.invalid) {
      return;
    }

    this.isLoadingReport = true;
    this.clearMessages();

    const formValue = this.reportForm.value;
    const filters: ReportFilters = {
      startDate: new Date(formValue.startDate),
      endDate: new Date(formValue.endDate),
      categoryIds: formValue.categoryIds.length > 0 ? formValue.categoryIds : undefined,
      productIds: formValue.productIds.length > 0 ? formValue.productIds : undefined,
      paymentMethods: formValue.paymentMethods.length > 0 ? formValue.paymentMethods : undefined,
    };

    this.reportService.generateSalesReport(filters).subscribe({
      next: report => {
        this.salesReport = report;
        this.generateCsvTable(); // Gera automaticamente a tabela CSV
        this.isLoadingReport = false;
      },
      error: err => {
        this.error = 'Erro ao gerar relatório';
        console.error('Erro ao gerar relatório:', err);
        this.isLoadingReport = false;
      },
    });
  }

  /**
   * Exportar relatório para CSV
   */
  exportReport(): void {
    if (!this.salesReport) {
      return;
    }

    this.reportService.exportToCsv(this.salesReport);
    this.success = 'Relatório exportado com sucesso!';
  }

  /**
   * Gerar dados para tabela CSV
   */
  generateCsvTable(): void {
    if (!this.salesReport) {
      return;
    }

    const data: any[] = [];

    // Adicionar vendas por método de pagamento
    if (this.salesReport.salesByPaymentMethod && this.salesReport.salesByPaymentMethod.length > 0) {
      this.salesReport.salesByPaymentMethod.forEach(payment => {
        data.push({
          type: 'Método de Pagamento',
          name: this.getPaymentMethodLabel(payment.method),
          quantity: payment.count,
          revenue: payment.revenue,
          percentage: payment.percentage,
        });
      });
    }

    // Adicionar vendas por categoria
    if (this.salesReport.salesByCategory && this.salesReport.salesByCategory.length > 0) {
      this.salesReport.salesByCategory.forEach(cat => {
        data.push({
          type: 'Categoria',
          name: cat.categoryName,
          quantity: cat.quantity,
          revenue: cat.revenue,
          percentage: cat.percentage,
        });
      });
    }

    // Adicionar vendas por produto
    if (this.salesReport.salesByProduct && this.salesReport.salesByProduct.length > 0) {
      this.salesReport.salesByProduct.forEach(prod => {
        data.push({
          type: 'Produto',
          name: prod.productName,
          quantity: prod.quantity,
          revenue: prod.revenue,
          percentage: null,
        });
      });
    }

    this.csvTableData = data;
    this.showCsvTable = true;
  }

  /**
   * Alternar exibição da tabela CSV
   */
  toggleCsvTable(): void {
    if (this.showCsvTable) {
      this.showCsvTable = false;
    } else {
      this.generateCsvTable();
    }
  }

  /**
   * Limpar mensagens de erro e sucesso
   */
  clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  /**
   * Formatar data para input type="date"
   */
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Formatar moeda
   */
  formatCurrency(value: number): string {
    return this.reportService.formatCurrency(value);
  }

  /**
   * Formatar data
   */
  formatDate(date: Date | string): string {
    return this.reportService.formatDate(date);
  }

  /**
   * Alternar exibição de todos os produtos
   */
  toggleShowAllProducts(): void {
    this.showAllProducts = !this.showAllProducts;
  }

  /**
   * Obter produtos para exibição (top 10 ou todos)
   */
  getDisplayedProducts(): any[] {
    if (!this.salesReport || !this.salesReport.salesByProduct) {
      return [];
    }
    return this.showAllProducts
      ? this.salesReport.salesByProduct
      : this.salesReport.salesByProduct.slice(0, 10);
  }

  /**
   * Obter cor de categoria por ID
   */
  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(cat => cat._id === categoryId);
    return category?.color || '#3b82f6';
  }

  /**
   * Obter nome de categoria por ID
   */
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat._id === categoryId);
    return category?.name || 'Desconhecida';
  }

  /**
   * Obter label de método de pagamento
   */
  getPaymentMethodLabel(method: string): string {
    const paymentMethod = this.availablePaymentMethods.find(pm => pm.value === method);
    return paymentMethod?.label || method;
  }

  /**
   * Calcular percentual
   */
  calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  /**
   * Carregar lista de produtos
   */
  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: response => {
        this.allProducts = response.data;
      },
      error: err => {
        console.error('Erro ao carregar produtos:', err);
      },
    });
  }

  /**
   * Abrir modal para gerenciar produtos da categoria
   */
  openProductsModal(category: ReportCategory): void {
    this.selectedCategoryForProducts = category;
    this.productSearchTerm = '';
    this.showProductsModal = true;
  }

  /**
   * Fechar modal de produtos
   */
  closeProductsModal(): void {
    this.showProductsModal = false;
    this.selectedCategoryForProducts = null;
    this.productSearchTerm = '';
  }

  /**
   * Verificar se produto está na categoria
   */
  isProductInCategory(productId: string): boolean {
    if (!this.selectedCategoryForProducts) return false;
    return this.selectedCategoryForProducts.productIds.includes(productId);
  }

  /**
   * Toggle produto na categoria
   */
  toggleProductInCategory(productId: string): void {
    if (!this.selectedCategoryForProducts) return;

    const category = this.selectedCategoryForProducts;
    const isCurrentlyInCategory = category.productIds.includes(productId);

    let updatedProductIds: string[];

    if (isCurrentlyInCategory) {
      // Remover produto
      updatedProductIds = category.productIds.filter(id => id !== productId);
    } else {
      // Adicionar produto
      updatedProductIds = [...category.productIds, productId];
    }

    // Atualizar no backend
    this.isLoading = true;
    this.reportService.updateCategory(category._id, { productIds: updatedProductIds }).subscribe({
      next: response => {
        // Atualizar localmente
        category.productIds = updatedProductIds;

        // Atualizar também na lista de categorias
        const categoryIndex = this.categories.findIndex(c => c._id === category._id);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex] = { ...category };
        }

        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erro ao atualizar produtos da categoria';
        console.error('Erro:', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Filtrar produtos por termo de busca
   */
  get filteredProducts(): Product[] {
    if (!this.productSearchTerm.trim()) {
      return this.allProducts;
    }

    const term = this.productSearchTerm.toLowerCase();
    return this.allProducts.filter(
      product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
    );
  }

  /**
   * Obter contagem de produtos na categoria
   */
  getProductCount(category: ReportCategory): number {
    return category.productIds.length;
  }
}
