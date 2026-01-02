import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { ReportCategory, SalesReport, ReportFilters } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';
import * as ExcelJS from 'exceljs';
import * as fileSaver from 'file-saver';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/reports`;

  const mockCategory: ReportCategory = {
    _id: '1',
    name: 'Bebidas',
    description: 'Todas as bebidas',
    color: '#3b82f6',
    productIds: ['p1', 'p2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Mock do localStorage
    let store: { [key: string]: string } = {};
    const mockLocalStorage = {
      getItem: (key: string): string | null => {
        return key in store ? store[key] : null;
      },
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
    spyOn(localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem);

    // Set token
    localStorage.setItem('auth_token', 'fake-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCategories', () => {
    it('should fetch categories', () => {
      const mockResponse = { categories: [mockCategory] };

      service.getCategories().subscribe(response => {
        expect(response.categories.length).toBe(1);
        expect(response.categories[0]).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${apiUrl}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createCategory', () => {
    it('should create a category', () => {
      const newCategory = { name: 'Nova Categoria', color: '#ff0000' };
      const mockResponse = { category: { ...newCategory, _id: '2' } as any };

      service.createCategory(newCategory).subscribe(response => {
        expect(response.category.name).toBe(newCategory.name);
      });

      const req = httpMock.expectOne(`${apiUrl}/categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCategory);
      req.flush(mockResponse);
    });
  });

  describe('updateCategory', () => {
    it('should update a category', () => {
      const updatedData = { name: 'Bebidas Atualizadas' };
      const mockResponse = { category: { ...mockCategory, ...updatedData } };

      service.updateCategory('1', updatedData).subscribe(response => {
        expect(response.category.name).toBe('Bebidas Atualizadas');
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', () => {
      const mockResponse = { message: 'Categoria deletada' };

      service.deleteCategory('1').subscribe(response => {
        expect(response.message).toBe('Categoria deletada');
      });

      const req = httpMock.expectOne(`${apiUrl}/categories/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('generateSalesReport', () => {
    it('should generate sales report', () => {
      const filters: ReportFilters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const mockReport: SalesReport = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        totalSales: 10,
        totalRevenue: 500,
        salesByCategory: [],
        salesByProduct: [],
        salesByPaymentMethod: [],
        dailySales: [],
      };

      service.generateSalesReport(filters).subscribe(report => {
        expect(report.totalSales).toBe(10);
      });

      const req = httpMock.expectOne(`${apiUrl}/sales`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockReport);
    });
  });

  describe('formatCurrency', () => {
    it('should format number as Brazilian currency', () => {
      const formatted = service.formatCurrency(1234.56);
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('R$');
    });
  });

  describe('formatDate', () => {
    it('should format date as Brazilian format', () => {
      const date = new Date(2024, 0, 15); // 15 de Janeiro de 2024
      const formatted = service.formatDate(date);
      // Use a more flexible regex to handle potential variations in Intl.DateTimeFormat output
      expect(formatted).toMatch(/15.01.2024/);
    });

    it('should format string date as Brazilian format', () => {
      // Use a date string that is less likely to be affected by timezone shifts
      const formatted = service.formatDate('2024-01-15T12:00:00');
      expect(formatted).toMatch(/15.01.2024/);
    });
  });

  describe('exportToCsv', () => {
    it('exportToCsv should export report to Excel file', async () => {
      const mockReport: SalesReport = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalSales: 100,
        totalRevenue: 5000,
        salesByCategory: [
          {
            categoryId: '1',
            categoryName: 'Bebidas',
            color: '#3b82f6',
            quantity: 50,
            revenue: 2500,
            percentage: 50,
            products: [],
          },
        ],
        salesByProduct: [
          {
            productId: 'p1',
            productName: 'Coca-Cola',
            quantity: 30,
            revenue: 150,
            averagePrice: 5,
          },
        ],
        salesByPaymentMethod: [],
        dailySales: [],
      };

      // Mock saveFile instead of saveAs
      // @ts-ignore
      const saveFileSpy = spyOn(service as any, 'saveFile').and.callFake(() => {});

      await service.exportToCsv(mockReport);

      // Since exportToCsv uses ExcelJS and saveFile, we just check if it was called
      expect(saveFileSpy).toHaveBeenCalled();
    });
  });
});
