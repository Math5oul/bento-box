import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductModalContainerComponent } from './product-modal-container.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../../../../services/auth-service/auth.service';
import { MockAuthService } from '../../../../../testing/auth-service.mock';
import { DiscountService } from '../../../../../services/discount-service/discount.service';

describe('ProductModalContainerComponent', () => {
  let component: ProductModalContainerComponent;
  let fixture: ComponentFixture<ProductModalContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductModalContainerComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }, DiscountService],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductModalContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
