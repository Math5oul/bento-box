import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { KitchenDashboardComponent } from './kitchen-dashboard.component';
import { AuthService } from '../../../services/auth-service/auth.service';

class MockAuthService {
  getToken() {
    return 'fake-token';
  }
}

describe('KitchenDashboardComponent', () => {
  let component: KitchenDashboardComponent;
  let fixture: ComponentFixture<KitchenDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenDashboardComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatTime should format a date string to HH:MM', () => {
    const formatted = component.formatTime(new Date('2025-01-01T08:30:00Z').toISOString());
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it('getStatusLabel should return label for known status', () => {
    expect(component.getStatusLabel('pending')).toBe('Pendente');
    expect(component.getStatusLabel('unknown')).toBe('unknown');
  });
});
