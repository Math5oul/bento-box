import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductModalContainerComponent } from './components/simpleComponents/simple-product/product-modal/product-modal-container/product-modal-container.component';
import { PermissionSyncBannerComponent } from './components/permission-sync-banner/permission-sync-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProductModalContainerComponent, PermissionSyncBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'bento-box';
}
