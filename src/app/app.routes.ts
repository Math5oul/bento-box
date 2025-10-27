import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { AdminOrdersComponent } from './components/admin/admin-orders.component';

export const routes: Routes = [
  { path: '', component: BentoModuleComponent },
  {
    path: 'table/:tableId/join',
    component: BentoModuleComponent,
  },
  {
    path: 'admin/pedidos',
    component: AdminOrdersComponent,
  },
];
