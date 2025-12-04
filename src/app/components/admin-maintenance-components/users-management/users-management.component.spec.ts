import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { UsersManagementComponent } from './users-management.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RoleService } from '../../../services/role.service';
import { of } from 'rxjs';

describe('UsersManagementComponent', () => {
  let component: UsersManagementComponent;
  let fixture: ComponentFixture<UsersManagementComponent>;
  let mockRoleService: jasmine.SpyObj<RoleService>;

  beforeEach(async () => {
    // Create mock for RoleService
    mockRoleService = jasmine.createSpyObj('RoleService', ['getRoles']);
    mockRoleService.getRoles.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [UsersManagementComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: RoleService, useValue: mockRoleService },
        { provide: PLATFORM_ID, useValue: 'server' }, // Prevent browser-specific code from running
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.activeTab).toBe('users');
    expect(component.users).toEqual([]);
    expect(component.roles).toEqual([]);
    expect(component.loading).toBe(true);
    expect(component.loadingRoles).toBe(true);
  });

  it('should not load data on server platform', () => {
    fixture.detectChanges();
    expect(mockRoleService.getRoles).not.toHaveBeenCalled();
  });
});
