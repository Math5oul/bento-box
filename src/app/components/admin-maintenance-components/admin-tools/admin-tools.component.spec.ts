import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminToolsComponent } from './admin-tools.component';

describe('AdminToolsComponent', () => {
  let component: AdminToolsComponent;
  let fixture: ComponentFixture<AdminToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminToolsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
