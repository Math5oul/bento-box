import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-permission-sync-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (needsSync) {
      <div class="sync-banner">
        <div class="sync-content">
          <span class="icon">⚠️</span>
          <div class="message">
            <strong>Permissões desatualizadas</strong>
            <p>Faça logout e login novamente para atualizar suas permissões.</p>
          </div>
          <button class="sync-button" (click)="forceLogout()">Fazer Logout</button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .sync-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 1rem;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .sync-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .message {
        flex: 1;
      }

      .message strong {
        display: block;
        font-size: 1.1rem;
        margin-bottom: 0.25rem;
      }

      .message p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.95;
      }

      .sync-button {
        background: white;
        color: #f5576c;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .sync-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      @media (max-width: 768px) {
        .sync-content {
          flex-direction: column;
          text-align: center;
        }

        .message p {
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class PermissionSyncBannerComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get needsSync(): boolean {
    const user = this.authService.getCurrentUser();
    // Verifica se role é ObjectId mas não tem permissions
    return !!(
      user?.role &&
      typeof user.role === 'string' &&
      user.role.length === 24 &&
      !user.permissions
    );
  }

  forceLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
