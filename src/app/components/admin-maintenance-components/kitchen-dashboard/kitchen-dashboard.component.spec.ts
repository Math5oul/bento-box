import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KitchenDashboardComponent } from './kitchen-dashboard.component';
import { AuthService } from '../../../services/auth-service/auth.service';
import { createCustomAuthServiceMock } from '../../../testing/auth-service.mock';

describe('KitchenDashboardComponent', () => {
  let component: KitchenDashboardComponent;
  let fixture: ComponentFixture<KitchenDashboardComponent>;

  beforeEach(async () => {
    const authServiceMock = createCustomAuthServiceMock({
      isKitchen: true,
      canAccessKitchenPanel: true,
      canManageOrders: true,
    });

    await TestBed.configureTestingModule({
      imports: [KitchenDashboardComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getElapsedTime should return a readable elapsed string', () => {
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000).toISOString();
    const res = component.getElapsedTime(thirtyMinsAgo);
    expect(res).toMatch(/min|h|agora/);
  });

  it('getStatusLabel should return label for known status', () => {
    expect(component.getStatusLabel('pending')).toBe('Pendente');
    expect(component.getStatusLabel('unknown')).toBe('unknown');
  });
});
