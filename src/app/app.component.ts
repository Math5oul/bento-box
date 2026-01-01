import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ProductModalContainerComponent } from './components/simpleComponents/simple-product/product-modal/product-modal-container/product-modal-container.component';
import { PermissionSyncBannerComponent } from './components/permission-sync-banner/permission-sync-banner.component';
import { AuthService } from './services/auth-service/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProductModalContainerComponent, PermissionSyncBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'bento-box';
  private authService = inject(AuthService);
  private router = inject(Router);
  private routerSubscription?: Subscription;

  async ngOnInit() {
    // Valida a sessão ao iniciar a aplicação
    if (this.authService.isAuthenticated()) {
      await this.authService.validateSession();
    }

    // Valida a sessão a cada navegação
    // Isso garante que se o token expirar, o usuário será deslogado
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(async () => {
        if (this.authService.isAuthenticated()) {
          await this.authService.validateSession();
        }
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }
}
