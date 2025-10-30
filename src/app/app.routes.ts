import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { AdminOrdersComponent } from './components/admin/admin-orders.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';

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
  {
    path: 'historico',
    component: OrderHistoryComponent,
  },
];
