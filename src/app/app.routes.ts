import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { adminGuard } from './guards/admin.guard';
import { kitchenGuard } from './guards/kitchen.guard';
import { waiterGuard } from './guards/waiter.guard';

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
    canActivate: [kitchenGuard],
  },
  {
    path: 'maintenance/waiter',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/waiter-dashboard/waiter-dashboard.component'
      ).then(m => m.WaiterDashboardComponent),
    canActivate: [waiterGuard],
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
    path: 'maintenance/admin-tools',
    loadComponent: () =>
      import('./components/admin-maintenance-components/admin-tools/admin-tools.component').then(
        m => m.AdminToolsComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'maintenance/tables',
    loadComponent: () =>
      import('./components/admin-panel-components/admin-panel/admin-panel.component').then(
        m => m.AdminPanelComponent
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
    path: 'maintenance/roles',
    loadComponent: () =>
      import(
        './components/admin-maintenance-components/roles-management/roles-management.component'
      ).then(m => m.RolesManagementComponent),
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
  {
    path: 'maintenance/checkout',
    loadComponent: () =>
      import('./components/admin-maintenance-components/checkout/checkout.component').then(
        m => m.CheckoutComponent
      ),
    canActivate: [adminGuard],
  },
];
