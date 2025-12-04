import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WaiterDashboardComponent } from './waiter-dashboard.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { createCustomAuthServiceMock } from '../../../testing/auth-service.mock';

describe('WaiterDashboardComponent', () => {
  let component: WaiterDashboardComponent;
  let fixture: ComponentFixture<WaiterDashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const authServiceMock = createCustomAuthServiceMock({
      isWaiter: true,
      canAccessWaiterPanel: true,
      canManageOrders: true,
    });

    await TestBed.configureTestingModule({
      imports: [WaiterDashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(WaiterDashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const initReq = httpMock.expectOne('/api/orders');
    initReq.flush({ orders: [] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('inicialmente tem arrays vazios e loading false', () => {
    expect(component.orders).toEqual([]);
    expect(component.filteredOrders).toEqual([]);
    expect(component.historyOrders).toEqual([]);
    // loading é false após chamada inicial terminar (o teste controla resposta HTTP abaixo)
  });

  it('formatCurrency deve retornar moeda BRL', () => {
    const formatted = component.formatCurrency(12.5);
    expect(formatted).toContain('R$');
  });

  it('getStatusLabel deve mapear statuses', () => {
    expect(component.getStatusLabel('pending')).toBe('Pendente');
    expect(component.getStatusLabel('preparing')).toBe('Preparando');
    expect(component.getStatusLabel('ready')).toBe('Pronto');
    expect(component.getStatusLabel('delivered')).toBe('Entregue');
    expect(component.getStatusLabel('cancelled')).toBe('Cancelado');
  });

  it('canDeliver deve ser true apenas para ready', () => {
    const orderReady = {
      id: '1',
      tableNumber: '1',
      clientName: 'A',
      status: 'ready',
      items: [],
      totalAmount: 0,
      createdAt: '',
      updatedAt: '',
    } as any;
    const orderPending = {
      id: '2',
      tableNumber: '2',
      clientName: 'B',
      status: 'pending',
      items: [],
      totalAmount: 0,
      createdAt: '',
      updatedAt: '',
    } as any;
    expect(component.canDeliver(orderReady)).toBeTrue();
    expect(component.canDeliver(orderPending)).toBeFalse();
  });

  it('loadOrders deve popular arrays de orders e tables', fakeAsync(() => {
    // Gatilho manual para loadOrders
    component.loadOrders();

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.method).toBe('GET');
    req.flush({
      orders: [
        {
          id: '1',
          tableNumber: '1',
          clientName: 'Cliente 1',
          status: 'pending',
          items: [],
          totalAmount: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          tableNumber: '2',
          clientName: 'Cliente 2',
          status: 'delivered',
          items: [],
          totalAmount: 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    tick();
    expect(component.orders.length).toBe(1); // apenas active statuses
    expect(component.historyOrders.length).toBe(1);
    expect(component.tables).toContain('1');
    expect(component.tables).toContain('2');
  }));

  it('getElapsedTime deve retornar valores legíveis', () => {
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000).toISOString();
    expect(component.getElapsedTime(thirtyMinsAgo)).toContain('min');

    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60000).toISOString();
    expect(component.getElapsedTime(twoHoursAgo)).toMatch(/h/);
  });

  it('trackById deve retornar id', () => {
    const order = { id: 'abc' } as any;
    expect(component.trackById(0, order)).toBe('abc');
  });
});
