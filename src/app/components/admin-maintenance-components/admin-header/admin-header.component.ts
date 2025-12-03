import { Component, inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth-service/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss',
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private routerSubscription?: Subscription;

  showLoginModal = false;
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  isLoggingIn = false;
  currentRoute = '';

  ngOnInit() {
    // Monitora mudanças de rota
    this.currentRoute = this.router.url;
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get frontendUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.origin;
    }
    return 'http://localhost:4200';
  }

  // Verifica se deve mostrar o botão na rota atual
  shouldShowButton(buttonRoute: string): boolean {
    // Não mostra o botão se já estamos na rota dele
    return !this.currentRoute.includes(buttonRoute);
  }

  openLoginModal(): void {
    this.showLoginModal = true;
    this.loginError = '';
    this.loginEmail = '';
    this.loginPassword = '';
  }

  closeLoginModal(): void {
    this.showLoginModal = false;
    this.loginError = '';
  }

  async handleLogin(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.loginEmail || !this.loginPassword) {
      this.loginError = 'Por favor, preencha todos os campos';
      return;
    }

    this.isLoggingIn = true;
    this.loginError = '';

    try {
      const response: any = await this.http
        .post('/api/auth/login', {
          email: this.loginEmail,
          password: this.loginPassword,
        })
        .toPromise();

      if (response.success && response.data) {
        // Salvar token e dados do usuário
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          // Recarregar a página para atualizar o estado
          window.location.reload();
        }

        this.closeLoginModal();
      } else {
        this.loginError = response.message || 'Erro ao fazer login';
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      this.loginError = error.error?.message || 'Credenciais inválidas';
    } finally {
      this.isLoggingIn = false;
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }

  goToApp(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = this.frontendUrl;
    }
  }
}
