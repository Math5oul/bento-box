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
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.scss'],
})
export class ChangePasswordModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  ngOnInit() {
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }
  }

  closeModal() {
    this.close.emit();
  }

  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Preencha todos os campos.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'A nova senha e a confirmação não conferem.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'A nova senha deve ter no mínimo 6 caracteres.';
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      this.successMessage = 'Senha alterada com sucesso!';

      setTimeout(() => {
        this.closeModal();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      this.errorMessage =
        error.error?.message || 'Erro ao alterar senha. Verifique sua senha atual.';
    } finally {
      this.isLoading = false;
    }
  }
}
