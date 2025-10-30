import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  inject,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnInit, OnDestroy {
  @Output() openProfile = new EventEmitter<void>();
  @Output() openOrders = new EventEmitter<void>();
  @Output() openPayments = new EventEmitter<void>();
  @Output() openChangePassword = new EventEmitter<void>();
  @Output() openAdminPanel = new EventEmitter<void>();

  authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  isMenuOpen = false;
  private overlayElement: HTMLElement | null = null;
  private dropdownElement: HTMLElement | null = null;

  ngOnInit() {
    // Não movemos o componente inteiro para o body, apenas criamos o overlay lá quando necessário
  }

  ngOnDestroy() {
    // Limpa o overlay e dropdown se existirem
    this.removeOverlay();
    this.removeDropdown();
  }

  get user() {
    return this.authService.getCurrentUser();
  }

  get isAdmin() {
    return this.authService.isAdmin();
  }

  get userInitial(): string {
    return this.user?.name?.charAt(0).toUpperCase() || '?';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      this.createOverlay();
      this.moveDropdownToBody();
    } else {
      this.removeOverlay();
      this.removeDropdown();
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.removeOverlay();
    this.removeDropdown();
  }

  private createOverlay() {
    if (this.overlayElement) return;

    // Cria o elemento overlay
    this.overlayElement = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayElement, 'user-menu-overlay');

    // Adiciona evento de clique
    this.renderer.listen(this.overlayElement, 'click', () => {
      this.closeMenu();
    });

    // Adiciona ao body
    this.renderer.appendChild(document.body, this.overlayElement);
  }

  private removeOverlay() {
    if (this.overlayElement) {
      this.renderer.removeChild(document.body, this.overlayElement);
      this.overlayElement = null;
    }
  }

  private moveDropdownToBody() {
    // Pega o elemento dropdown do template
    const dropdown = this.elementRef.nativeElement.querySelector('.menu-dropdown');
    if (dropdown && !this.dropdownElement) {
      this.dropdownElement = dropdown;
      // Move para o body
      this.renderer.appendChild(document.body, dropdown);
      // Adiciona a classe open
      this.renderer.addClass(dropdown, 'open');
    }
  }

  private removeDropdown() {
    if (this.dropdownElement) {
      // Remove a classe open
      this.renderer.removeClass(this.dropdownElement, 'open');

      // Move de volta para o container original
      const container = this.elementRef.nativeElement.querySelector('.user-menu-container');
      if (container) {
        this.renderer.appendChild(container, this.dropdownElement);
      }

      this.dropdownElement = null;
    }
  }

  onProfileClick() {
    this.openProfile.emit();
    this.closeMenu();
  }

  onOrdersClick() {
    this.openOrders.emit();
    this.closeMenu();
  }

  onPaymentsClick() {
    this.openPayments.emit();
    this.closeMenu();
  }

  onChangePasswordClick() {
    this.openChangePassword.emit();
    this.closeMenu();
  }

  onAdminPanelClick() {
    this.openAdminPanel.emit();
    this.closeMenu();
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }
}
