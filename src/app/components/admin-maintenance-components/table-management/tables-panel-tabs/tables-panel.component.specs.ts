import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPanelComponent } from './tables-panel.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../services/auth-service/auth.service';
import { defaultActivatedRouteMock } from '../../../../testing/activated-route.mock';
import { createCustomAuthServiceMock } from '../../../../testing/auth-service.mock';

describe('AdminPanelComponent', () => {
  let component: AdminPanelComponent;
  let fixture: ComponentFixture<AdminPanelComponent>;

  beforeEach(async () => {
    const authServiceMock = createCustomAuthServiceMock({
      canAccessAdminPanel: true,
      canManageTables: true,
    });

    await TestBed.configureTestingModule({
      imports: [AdminPanelComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: defaultActivatedRouteMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default active tab as tables', () => {
    expect(component.activeTab).toBe('tables');
  });

  it('should switch active tab to reservations', () => {
    component.activeTab = 'reservations';
    expect(component.activeTab).toBe('reservations');
  });
});
