import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOrdersComponent } from './admin-orders.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminOrdersComponent', () => {
  let component: AdminOrdersComponent;
  let fixture: ComponentFixture<AdminOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrdersComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
