import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnInit,
  OnDestroy,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
})
export class LoginModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<{ token: string; user: any }>();

  private http = inject(HttpClient);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  private authService = inject(AuthService);

  isRegistering = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hasAnonymousSession = false;
  anonymousTableNumber = '';

  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  ngOnInit() {
    // Move o elemento para o body ao inicializar
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);

    // Verifica se existe sessão anônima
    this.hasAnonymousSession = this.authService.hasAnonymousSession();
    if (this.hasAnonymousSession) {
      const session = this.authService.getAnonymousSession();
      if (session) {
        this.anonymousTableNumber = session.tableNumber;
      }
    }
  }

  ngOnDestroy() {
    // Remove o elemento do body ao destruir
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }
  }

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.errorMessage = '';
    this.successMessage = '';
    this.formData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
  }

  closeModal() {
    this.close.emit();
  }

  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validação básica
    if (!this.formData.email || !this.formData.password) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    if (this.isRegistering && !this.formData.name) {
      this.errorMessage = 'Por favor, preencha seu nome.';
      return;
    }

    // Validação de confirmação de senha
    if (this.isRegistering && this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'As senhas não conferem.';
      return;
    }

    this.isLoading = true;

    try {
      let response: any;

      // Se tem sessão anônima, usa a rota de conversão
      if (this.hasAnonymousSession) {
        if (this.isRegistering) {
          response = await this.authService.convertAnonymousWithRegister(
            this.formData.name,
            this.formData.email,
            this.formData.password
          );
          this.successMessage = `✅ Conta criada e vinculada à Mesa ${this.anonymousTableNumber}!`;
        } else {
          response = await this.authService.convertAnonymousWithLogin(
            this.formData.email,
            this.formData.password
          );
          this.successMessage = `✅ Login realizado e conta vinculada à Mesa ${this.anonymousTableNumber}!`;
        }
      } else {
        // Login/registro normal sem sessão anônima
        const endpoint = this.isRegistering ? '/api/auth/register' : '/api/auth/login';
        const payload = this.isRegistering
          ? {
              name: this.formData.name,
              email: this.formData.email,
              password: this.formData.password,
              confirmPassword: this.formData.confirmPassword,
            }
          : {
              email: this.formData.email,
              password: this.formData.password,
            };

        response = await this.http.post(endpoint, payload).toPromise();

        if (response.token) {
          this.successMessage = this.isRegistering
            ? 'Conta criada com sucesso!'
            : 'Login realizado com sucesso!';

          // Usa o AuthService para gerenciar o login
          this.authService.login(response.token, response.user);
        }
      }

      if (response && (response.token || response.success)) {
        this.loginSuccess.emit({ token: response.token, user: response.user });

        setTimeout(() => {
          this.closeModal();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro no login/registro:', error);

      if (error.error?.errors && Array.isArray(error.error.errors)) {
        this.errorMessage = error.error.errors.map((err: any) => err.message || err.msg).join(', ');
      } else if (error.error?.message) {
        this.errorMessage = error.error.message;
      } else {
        this.errorMessage = 'Erro ao processar requisição. Tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
