import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleProductComponent } from './simple-product.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../../services/auth-service/auth.service';
import { MockAuthService } from '../../../testing/auth-service.mock';

describe('SimpleProductComponent', () => {
  let component: SimpleProductComponent;
  let fixture: ComponentFixture<SimpleProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleProductComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
