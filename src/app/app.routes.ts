import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { adminGuard } from './guards/admin.guard';
import { kitchenGuard } from './guards/kitchen.guard';

export const routes: Routes = [
  { path: '', component: BentoModuleComponent },
  {
    path: 'table/:tableId/join',
    component: BentoModuleComponent,
  },
  {
    path: 'maintenance/kitchen',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/kitchen-dashboard/kitchen-dashboard.component'
      ).then(m => m.KitchenDashboardComponent),
    canActivate: [kitchenGuard, adminGuard],
  },
  // Rotas de manutenção/administração (protegidas por adminGuard)
  {
    path: 'maintenance/docs',
    loadComponent: () =>
      import('./components/admin-maintenance-components/docs/docs.component').then(
        m => m.DocsComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/test-hub',
    loadComponent: () =>
      import('./components/admin-maintenance-components/test-hub/test-hub.component').then(
        m => m.TestHubComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/users',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/users-management/users-management.component'
      ).then(m => m.UsersManagementComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/test-upload',
    loadComponent: () =>
      import('./components/admin-maintenance-components/test-upload/test-upload.component').then(
        m => m.TestUploadComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/fillers',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/fillers-management/fillers-management.component'
      ).then(m => m.FillersManagementComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/products',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/products-management/products-management.component'
      ).then(m => m.ProductsManagementComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/categories',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/categories-management/categories-management.component'
      ).then(m => m.CategoriesManagementComponent),
    canActivate: [adminGuard],
  },
];
