import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminHeaderComponent } from './admin-header.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth-service/auth.service';
import { MockAuthService } from '../../../testing/auth-service.mock';

describe('AdminHeaderComponent', () => {
  let component: AdminHeaderComponent;
  let fixture: ComponentFixture<AdminHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHeaderComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });
});
