import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
  selector: 'app-admin-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login-modal.component.html',
  styleUrls: ['./admin-login-modal.component.scss'],
})
export class AdminLoginModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<{ token: string; user: any }>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  formData = {
    email: '',
    password: '',
  };

  closeModal() {
    this.close.emit();
  }

  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formData.email || !this.formData.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.isLoading = true;
    try {
      const response: any = await this.http
        .post('/api/auth/login', {
          email: this.formData.email,
          password: this.formData.password,
        })
        .toPromise();

      if (response.user?.role !== 'admin') {
        this.errorMessage = 'Apenas administradores podem acessar por aqui.';
        this.isLoading = false;
        return;
      }

      if (response.token) {
        this.successMessage = 'Login de admin realizado com sucesso!';
        this.authService.login(response.token, response.user);
        this.loginSuccess.emit({ token: response.token, user: response.user });
        setTimeout(() => this.closeModal(), 1500);
      } else {
        this.errorMessage = response.message || 'Erro ao fazer login.';
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Erro ao processar requisição.';
    } finally {
      this.isLoading = false;
    }
  }
}
