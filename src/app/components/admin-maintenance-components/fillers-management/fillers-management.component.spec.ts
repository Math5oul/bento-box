import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FillersManagementComponent } from './fillers-management.component';

describe('FillersManagementComponent', () => {
  let component: FillersManagementComponent;
  let fixture: ComponentFixture<FillersManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FillersManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FillersManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });
});
