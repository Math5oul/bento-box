import { Routes } from '@angular/router';
import { BentoModuleComponent } from './bento-module/bento-module.component';
import { CartComponent } from './components/cart/cart.component';

export const routes: Routes = [
  { path: '', component: BentoModuleComponent },
  { path: 'cart', component: CartComponent }
];
