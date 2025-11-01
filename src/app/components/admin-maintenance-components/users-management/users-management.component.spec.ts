import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersManagementComponent } from './users-management.component';

describe('UsersManagementComponent', () => {
  let component: UsersManagementComponent;
  let fixture: ComponentFixture<UsersManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
