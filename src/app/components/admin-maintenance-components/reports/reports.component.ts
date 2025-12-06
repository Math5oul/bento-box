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
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminHeaderComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  // Expor Math para o template
  Math = Math;

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
  pendingProductChanges: Map<string, string[]> = new Map(); // categoryId -> productIds

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
          quantity: Math.round(cat.quantity),
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
          quantity: Math.round(prod.quantity),
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
    // Se houver mudanças pendentes, perguntar se quer descartar
    if (this.pendingProductChanges.size > 0) {
      if (!confirm('Há alterações não salvas. Deseja descartar as alterações?')) {
        return;
      }
      // Recarregar categorias para descartar mudanças locais
      this.loadCategories();
      this.pendingProductChanges.clear();
    }

    this.showProductsModal = false;
    this.selectedCategoryForProducts = null;
    this.productSearchTerm = '';
  }

  /**
   * Verificar se produto está na categoria
   */
  isProductInCategory(productId: string): boolean {
    if (!this.selectedCategoryForProducts) return false;

    // Verificar se o productId está na lista, lidando com objetos ou strings
    return this.selectedCategoryForProducts.productIds.some(id => {
      // Extrair o ID se for um objeto, senão usar como string
      const categoryProductId =
        typeof id === 'object' && id !== null && '_id' in id ? String((id as any)._id) : String(id);
      return categoryProductId === productId;
    });
  }

  /**
   * Toggle produto na categoria (apenas localmente)
   */
  toggleProductInCategory(productId: string): void {
    if (!this.selectedCategoryForProducts) return;

    const category = this.selectedCategoryForProducts;

    // Converter productIds para strings para comparação
    const normalizeId = (id: any): string => {
      return typeof id === 'object' && id !== null && '_id' in id ? String(id._id) : String(id);
    };

    // Verificar se produto está na categoria
    const isCurrentlyInCategory = category.productIds.some(id => normalizeId(id) === productId);

    console.log('🔄 Toggle produto:', productId, 'está na categoria?', isCurrentlyInCategory);
    console.log('📋 IDs atuais:', category.productIds);

    if (isCurrentlyInCategory) {
      // Remover produto - criar novo array
      const newProductIds = category.productIds
        .filter(id => normalizeId(id) !== productId)
        .map(id => normalizeId(id));

      console.log('❌ Removendo produto. Novos IDs:', newProductIds);
      category.productIds = newProductIds as any[];
    } else {
      // Adicionar produto (e remover de outras categorias)
      // Primeiro remove de todas as outras categorias
      this.categories.forEach(cat => {
        if (cat._id !== category._id) {
          const hasProduct = cat.productIds.some(id => normalizeId(id) === productId);
          if (hasProduct) {
            cat.productIds = cat.productIds
              .filter(id => normalizeId(id) !== productId)
              .map(id => normalizeId(id)) as any[];
            // Marcar categoria como tendo mudanças pendentes
            this.pendingProductChanges.set(cat._id, cat.productIds);
          }
        }
      });

      // Adicionar na categoria atual - normalizar todos os IDs e criar novo array
      const normalizedIds = category.productIds.map(id => normalizeId(id));
      category.productIds = [...normalizedIds, productId] as any[];

      console.log('✅ Adicionando produto. Novos IDs:', category.productIds);
    }

    // Marcar categoria atual como tendo mudanças pendentes
    this.pendingProductChanges.set(category._id, category.productIds);

    // Atualizar também na lista de categorias - criar novo objeto para forçar detecção de mudanças
    const categoryIndex = this.categories.findIndex(c => c._id === category._id);
    if (categoryIndex !== -1) {
      this.categories[categoryIndex] = {
        ...category,
        productIds: [...category.productIds], // Criar nova referência do array
      };
      // Atualizar a referência selecionada também
      this.selectedCategoryForProducts = this.categories[categoryIndex];
    }

    console.log('✔️ Categoria atualizada:', this.selectedCategoryForProducts.productIds);
  }

  /**
   * Salvar todas as alterações de produtos (ao clicar em Concluído)
   */
  async saveProductChanges(): Promise<void> {
    if (this.pendingProductChanges.size === 0) {
      this.closeProductsModal();
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      // Enviar todas as alterações pendentes
      const updates = Array.from(this.pendingProductChanges.entries()).map(
        ([categoryId, productIds]) => {
          return this.reportService.updateCategory(categoryId, { productIds }).toPromise();
        }
      );

      await Promise.all(updates);

      this.success = 'Produtos atualizados com sucesso!';
      this.pendingProductChanges.clear();
      this.closeProductsModal();

      // Recarregar categorias para garantir sincronização
      await this.loadCategories();
    } catch (err) {
      this.error = 'Erro ao salvar alterações de produtos';
      console.error('Erro:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Filtrar produtos por termo de busca e excluir produtos de outras categorias
   */
  get filteredProducts(): Product[] {
    if (!this.selectedCategoryForProducts) {
      return this.allProducts;
    }

    const normalizeId = (id: any): string => {
      return typeof id === 'object' && id !== null && '_id' in id ? String(id._id) : String(id);
    };

    // Obter IDs de produtos em outras categorias (exceto a categoria atual)
    const productsInOtherCategories = new Set<string>();
    this.categories.forEach(category => {
      if (category._id !== this.selectedCategoryForProducts?._id) {
        category.productIds.forEach(productId => {
          productsInOtherCategories.add(normalizeId(productId));
        });
      }
    });

    // Filtrar produtos
    let products = this.allProducts.filter(product => {
      const productId = String(product._id);
      // Excluir produtos que estão em outras categorias
      if (productsInOtherCategories.has(productId)) {
        return false;
      }
      return true;
    });

    // Aplicar filtro de busca se houver
    if (this.productSearchTerm.trim()) {
      const term = this.productSearchTerm.toLowerCase();
      products = products.filter(
        product =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
      );
    }

    return products;
  }

  /**
   * Obter contagem de produtos na categoria
   */
  getProductCount(category: ReportCategory): number {
    return category.productIds.length;
  }

  /**
   * Verificar se há produtos sem categoria
   */
  get hasUncategorizedProducts(): boolean {
    const allCategorizedProductIds = new Set<string>();

    this.categories.forEach(category => {
      category.productIds.forEach(productId => {
        // Extrair o ID se for um objeto, senão usar como string
        const id =
          typeof productId === 'object' && productId !== null && '_id' in productId
            ? String((productId as any)._id)
            : String(productId);
        allCategorizedProductIds.add(id);
      });
    });

    return this.allProducts.some(product => {
      const productId = String(product._id);
      return product._id && !allCategorizedProductIds.has(productId);
    });
  }

  /**
   * Obter lista de produtos não categorizados
   */
  get uncategorizedProducts(): Product[] {
    const allCategorizedProductIds = new Set<string>();

    this.categories.forEach(category => {
      category.productIds.forEach(productId => {
        // Extrair o ID se for um objeto, senão usar como string
        const id =
          typeof productId === 'object' && productId !== null && '_id' in productId
            ? String((productId as any)._id)
            : String(productId);
        allCategorizedProductIds.add(id);
      });
    });

    return this.allProducts.filter(product => {
      const productId = String(product._id);
      return product._id && !allCategorizedProductIds.has(productId);
    });
  }
}
