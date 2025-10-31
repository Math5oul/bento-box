import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { AdminOrdersComponent } from './components/admin-panel-components/admin-all-orders/admin-orders.component';

export const routes: Routes = [
  { path: '', component: BentoModuleComponent },
  {
    path: 'table/:tableId/join',
    component: BentoModuleComponent,
  },
];
