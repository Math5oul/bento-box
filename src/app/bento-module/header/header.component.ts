import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CartService } from '../../services/cart-service/cart.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { CartComponent } from '../../components/cart/cart.component';
import { CommonModule } from '@angular/common';
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { UserMenuComponent } from '../../components/user-menu/user-menu.component';
import { AdminPanelComponent } from '../../components/admin-panel/admin-panel.component';
import { ChangePasswordModalComponent } from '../../components/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CartComponent,
    CommonModule,
    LoginModalComponent,
    UserMenuComponent,
    AdminPanelComponent,
    ChangePasswordModalComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isCartOpen = false;
  isLoginOpen = false;
  isAdminPanelOpen = false;
  isChangePasswordOpen = false;

  @Output() search = new EventEmitter<string>();

  _cartService = inject(CartService);
  authService = inject(AuthService);

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  toggleLogin() {
    this.isLoginOpen = !this.isLoginOpen;
  }

  onLoginSuccess(data: { token: string; user: any }) {
    this.authService.login(data.token, data.user);
    console.log('Login bem-sucedido:', data.user);
    this.isLoginOpen = false;
  }

  // Handlers para os itens do menu do usuário
  onOpenProfile() {
    console.log('Abrir perfil');
    // TODO: Implementar tela de perfil
  }

  onOpenOrders() {
    console.log('Abrir histórico de pedidos');
    // TODO: Implementar tela de pedidos
  }

  onOpenPayments() {
    console.log('Abrir métodos de pagamento');
    // TODO: Implementar tela de pagamentos
  }

  onOpenChangePassword() {
    this.isChangePasswordOpen = true;
  }

  onCloseChangePassword() {
    this.isChangePasswordOpen = false;
  }

  onOpenAdminPanel() {
    this.isAdminPanelOpen = true;
  }

  onCloseAdminPanel() {
    this.isAdminPanelOpen = false;
  }

  onSearchInput(value: string) {
    this.search.emit(value);
  }
}
