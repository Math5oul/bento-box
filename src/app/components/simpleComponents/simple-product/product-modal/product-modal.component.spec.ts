import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductModalComponent } from './product-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../../../services/auth-service/auth.service';
import { MockAuthService } from '../../../../testing/auth-service.mock';
import { DiscountService } from '../../../../services/discount-service/discount.service';

describe('ProductModalComponent', () => {
  let component: ProductModalComponent;
  let fixture: ComponentFixture<ProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductModalComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }, DiscountService],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
