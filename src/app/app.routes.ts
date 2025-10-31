import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { AdminOrdersComponent } from './components/admin/admin-orders.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { adminGuard } from './guards/admin.guard';

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
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [adminGuard],
  },
];
