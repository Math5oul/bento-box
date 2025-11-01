import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsManagementComponent } from './products-management.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ProductsManagementComponent', () => {
  let component: ProductsManagementComponent;
  let fixture: ComponentFixture<ProductsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsManagementComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar com arrays vazios', () => {
    expect(component.products).toEqual([]);
    expect(component.loading).toBe(true);
  });

  it('deve formatar preço corretamente', () => {
    const formatted = component.formatPrice(29.9);
    expect(formatted).toContain('29,90');
  });

  it('deve truncar texto longo', () => {
    const longText = 'a'.repeat(150);
    const truncated = component.truncateText(longText, 100);
    expect(truncated.length).toBe(103); // 100 + '...'
  });

  it('deve retornar emoji correto para categoria', () => {
    expect(component.getCategoryEmoji('food')).toBe('🥐');
    expect(component.getCategoryEmoji('dessert')).toBe('🍰');
    expect(component.getCategoryEmoji('unknown')).toBe('📦');
  });
});
