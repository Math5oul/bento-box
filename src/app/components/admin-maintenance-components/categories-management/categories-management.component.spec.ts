import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriesManagementComponent } from './categories-management.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('CategoriesManagementComponent', () => {
  let component: CategoriesManagementComponent;
  let fixture: ComponentFixture<CategoriesManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesManagementComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar com listas vazias e loading true', () => {
    expect(component.categories).toEqual([]);
    expect(component.loading).toBeTrue();
  });

  it('generateSlug deve normalizar strings', () => {
    const slug = component.generateSlug('Ãçẽ Teste! Categoria  ');
    expect(slug).toBe('ace-teste-categoria');
  });

  it('getTotalProducts deve somar productCount', () => {
    component.categories = [
      {
        _id: '1',
        name: 'A',
        emoji: '📦',
        slug: 'a',
        index: 0,
        productCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '2',
        name: 'B',
        emoji: '📦',
        slug: 'b',
        index: 1,
        productCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '3',
        name: 'C',
        emoji: '📦',
        slug: 'c',
        index: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    expect(component.getTotalProducts()).toBe(5);
  });
});
