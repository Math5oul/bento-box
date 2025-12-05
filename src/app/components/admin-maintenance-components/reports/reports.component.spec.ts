import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ReportsComponent } from './reports.component';
import { ReportService } from '../../../services/report.service';
import { ReportCategory, SalesReport } from '../../../interfaces/report.interface';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let mockReportService: jasmine.SpyObj<ReportService>;
  let mockProductService: jasmine.SpyObj<any>;

  const mockCategories: ReportCategory[] = [
    {
      _id: '1',
      name: 'Bebidas',
      description: 'Todas as bebidas',
      color: '#3b82f6',
      productIds: ['p1', 'p2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockProducts: any[] = [
    {
      _id: 'p1',
      name: 'Coca-Cola',
      price: 5,
      description: 'Refrigerante',
      images: [],
      category: 'bebidas',
      available: true,
    },
    {
      _id: 'p2',
      name: 'Guaraná',
      price: 4.5,
      description: 'Refrigerante',
      images: [],
      category: 'bebidas',
      available: true,
    },
    {
      _id: 'p3',
      name: 'Água',
      price: 3,
      description: 'Água mineral',
      images: [],
      category: 'bebidas',
      available: true,
    },
  ];

  const mockSalesReport: SalesReport = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalSales: 100,
    totalRevenue: 5000,
    salesByCategory: [],
    salesByProduct: [],
    salesByPaymentMethod: [],
    dailySales: [],
  };

  beforeEach(async () => {
    mockReportService = jasmine.createSpyObj('ReportService', [
      'getCategories',
      'createCategory',
      'updateCategory',
      'deleteCategory',
      'generateSalesReport',
      'exportToCsv',
      'formatCurrency',
      'formatDate',
    ]);

    mockProductService = jasmine.createSpyObj('ProductService', ['getAllProducts']);

    mockReportService.getCategories.and.returnValue(of({ categories: mockCategories }));
    mockReportService.formatCurrency.and.returnValue('R$ 5.000,00');
    mockReportService.formatDate.and.returnValue('01/01/2024');
    mockProductService.getAllProducts.and.returnValue(
      of({ data: mockProducts, success: true, count: 3 })
    );

    await TestBed.configureTestingModule({
      imports: [ReportsComponent, ReactiveFormsModule],
      providers: [
        { provide: ReportService, useValue: mockReportService },
        { provide: 'ProductService', useValue: mockProductService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.activeTab).toBe('sales');
    expect(component.categories).toEqual([]);
    expect(component.salesReport).toBeNull();
    expect(component.isLoading).toBeFalse();
  });

  it('should load categories on init', () => {
    component.ngOnInit();
    expect(mockReportService.getCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
  });

  it('should handle error when loading categories', () => {
    mockReportService.getCategories.and.returnValue(throwError(() => new Error('Network error')));

    component.loadCategories();

    expect(component.error).toBe('Erro ao carregar categorias');
    expect(component.isLoading).toBeFalse();
  });

  it('should switch active tab', () => {
    component.setActiveTab('categories');
    expect(component.activeTab).toBe('categories');

    component.setActiveTab('analysis');
    expect(component.activeTab).toBe('analysis');
  });

  it('should open create category modal', () => {
    component.openCreateCategoryModal();

    expect(component.showCategoryModal).toBeTrue();
    expect(component.isEditingCategory).toBeFalse();
    expect(component.selectedCategory).toBeNull();
  });

  it('should open edit category modal', () => {
    const category = mockCategories[0];

    component.openEditCategoryModal(category);

    expect(component.showCategoryModal).toBeTrue();
    expect(component.isEditingCategory).toBeTrue();
    expect(component.selectedCategory).toBe(category);
    expect(component.categoryForm.get('name')?.value).toBe(category.name);
  });

  it('should close category modal', () => {
    component.showCategoryModal = true;
    component.selectedCategory = mockCategories[0];

    component.closeCategoryModal();

    expect(component.showCategoryModal).toBeFalse();
    expect(component.selectedCategory).toBeNull();
  });

  it('should create new category', () => {
    const newCategory = { name: 'Nova Categoria', color: '#ff0000' };
    mockReportService.createCategory.and.returnValue(
      of({ category: { ...newCategory, _id: '2' } as any })
    );

    component.categoryForm.patchValue(newCategory);
    component.isEditingCategory = false;

    component.saveCategory();

    expect(mockReportService.createCategory).toHaveBeenCalledWith(
      jasmine.objectContaining(newCategory)
    );
  });

  it('should update existing category', () => {
    const category = mockCategories[0];
    const updatedData = { name: 'Bebidas Atualizadas', color: '#00ff00' };
    mockReportService.updateCategory.and.returnValue(
      of({ category: { ...category, ...updatedData } })
    );

    component.selectedCategory = category;
    component.isEditingCategory = true;
    component.categoryForm.patchValue(updatedData);

    component.saveCategory();

    expect(mockReportService.updateCategory).toHaveBeenCalledWith(
      category._id,
      jasmine.objectContaining(updatedData)
    );
  });

  it('should not save category if form is invalid', () => {
    component.categoryForm.patchValue({ name: '' });

    component.saveCategory();

    expect(mockReportService.createCategory).not.toHaveBeenCalled();
    expect(mockReportService.updateCategory).not.toHaveBeenCalled();
  });

  it('should delete category with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockReportService.deleteCategory.and.returnValue(of({ message: 'Deleted' }));

    const category = mockCategories[0];
    component.deleteCategory(category);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockReportService.deleteCategory).toHaveBeenCalledWith(category._id);
  });

  it('should not delete category without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const category = mockCategories[0];
    component.deleteCategory(category);

    expect(mockReportService.deleteCategory).not.toHaveBeenCalled();
  });

  it('should generate sales report', () => {
    mockReportService.generateSalesReport.and.returnValue(of(mockSalesReport));

    component.reportForm.patchValue({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    component.generateReport();

    expect(mockReportService.generateSalesReport).toHaveBeenCalled();
    expect(component.salesReport).toEqual(mockSalesReport);
  });

  it('should not generate report if form is invalid', () => {
    component.reportForm.patchValue({ startDate: '', endDate: '' });

    component.generateReport();

    expect(mockReportService.generateSalesReport).not.toHaveBeenCalled();
  });

  it('should export report to CSV', () => {
    component.salesReport = mockSalesReport;

    component.exportReport();

    expect(mockReportService.exportToCsv).toHaveBeenCalledWith(mockSalesReport);
    expect(component.success).toBe('Relatório exportado com sucesso!');
  });

  it('should not export if no report exists', () => {
    component.salesReport = null;

    component.exportReport();

    expect(mockReportService.exportToCsv).not.toHaveBeenCalled();
  });

  it('should clear error and success messages', () => {
    component.error = 'Some error';
    component.success = 'Some success';

    component.clearMessages();

    expect(component.error).toBeNull();
    expect(component.success).toBeNull();
  });

  it('should format date for input', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDateForInput(date);

    expect(formatted).toBe('2024-01-15');
  });

  it('should get category color by id', () => {
    component.categories = mockCategories;

    const color = component.getCategoryColor('1');
    expect(color).toBe('#3b82f6');

    const defaultColor = component.getCategoryColor('nonexistent');
    expect(defaultColor).toBe('#3b82f6');
  });

  it('should get category name by id', () => {
    component.categories = mockCategories;

    const name = component.getCategoryName('1');
    expect(name).toBe('Bebidas');

    const unknownName = component.getCategoryName('nonexistent');
    expect(unknownName).toBe('Desconhecida');
  });

  it('should get payment method label', () => {
    const label = component.getPaymentMethodLabel('pix');
    expect(label).toBe('PIX');

    const unknownLabel = component.getPaymentMethodLabel('unknown_method');
    expect(unknownLabel).toBe('unknown_method');
  });

  it('should calculate percentage correctly', () => {
    expect(component.calculatePercentage(25, 100)).toBe(25);
    expect(component.calculatePercentage(50, 200)).toBe(25);
    expect(component.calculatePercentage(10, 0)).toBe(0);
  });

  describe('Product Management', () => {
    it('should load products on init', () => {
      component.ngOnInit();
      expect(mockProductService.getAllProducts).toHaveBeenCalled();
      expect(component.allProducts).toEqual(mockProducts);
    });

    it('should open products modal', () => {
      const category = mockCategories[0];

      component.openProductsModal(category);

      expect(component.showProductsModal).toBeTrue();
      expect(component.selectedCategoryForProducts).toBe(category);
      expect(component.productSearchTerm).toBe('');
    });

    it('should close products modal', () => {
      component.showProductsModal = true;
      component.selectedCategoryForProducts = mockCategories[0];
      component.productSearchTerm = 'test';

      component.closeProductsModal();

      expect(component.showProductsModal).toBeFalse();
      expect(component.selectedCategoryForProducts).toBeNull();
      expect(component.productSearchTerm).toBe('');
    });

    it('should check if product is in category', () => {
      component.selectedCategoryForProducts = mockCategories[0];

      expect(component.isProductInCategory('p1')).toBeTrue();
      expect(component.isProductInCategory('p3')).toBeFalse();
    });

    it('should toggle product in category - add', () => {
      const category = mockCategories[0];
      component.selectedCategoryForProducts = category;

      mockReportService.updateCategory.and.returnValue(
        of({
          category: { ...category, productIds: [...category.productIds, 'p3'] },
        })
      );

      component.toggleProductInCategory('p3');

      expect(mockReportService.updateCategory).toHaveBeenCalledWith(category._id, {
        productIds: ['p1', 'p2', 'p3'],
      });
    });

    it('should toggle product in category - remove', () => {
      const category = mockCategories[0];
      component.selectedCategoryForProducts = category;

      mockReportService.updateCategory.and.returnValue(
        of({
          category: { ...category, productIds: ['p2'] },
        })
      );

      component.toggleProductInCategory('p1');

      expect(mockReportService.updateCategory).toHaveBeenCalledWith(category._id, {
        productIds: ['p2'],
      });
    });

    it('should filter products by search term', () => {
      component.allProducts = mockProducts;
      component.productSearchTerm = 'coca';

      const filtered = component.filteredProducts;

      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Coca-Cola');
    });

    it('should return all products when search term is empty', () => {
      component.allProducts = mockProducts;
      component.productSearchTerm = '';

      const filtered = component.filteredProducts;

      expect(filtered.length).toBe(3);
    });

    it('should get product count for category', () => {
      const category = mockCategories[0];

      const count = component.getProductCount(category);

      expect(count).toBe(2);
    });
  });
});
