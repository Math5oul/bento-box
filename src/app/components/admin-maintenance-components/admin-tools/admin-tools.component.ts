import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

@Component({
  selector: 'app-admin-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminHeaderComponent],
  templateUrl: './admin-tools.component.html',
  styleUrl: './admin-tools.component.scss',
})
export class AdminToolsComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  currentToken: string | null = null;
  backendStatus = 'offline';
  dbStatus = 'checking...';
  productsCount = 0;
  frontendUrl = 'http://localhost:4200';
  mongoUri = 'mongodb://localhost:27017/bento-box';

  // Campos de formulário
  adminName = 'Admin Bento';
  adminEmail = 'admin@bentobox.com';
  adminPassword = 'admin123';
  clientName = 'João Silva';
  clientEmail = 'joao@email.com';
  clientPassword = 'senha123';
  loginEmail = 'joao@email.com';
  loginPassword = 'senha123';

  // Resultados
  results: { [key: string]: any } = {};

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkBackendStatus();
      this.checkProductsCount();
      setInterval(() => {
        this.checkBackendStatus();
        this.checkProductsCount();
      }, 10000);
    }
  }

  get userRole(): string | null {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored).role || null;
    } catch {
      return null;
    }
  }

  async checkBackendStatus(): Promise<void> {
    try {
      const res: any = await this.http.get('/api/health').toPromise();
      this.backendStatus = 'online';
      this.dbStatus = res.db?.readyState === 1 ? 'connected' : 'disconnected';
      this.frontendUrl = res.frontendUrl || this.frontendUrl;
      this.mongoUri = res.mongoUri || this.mongoUri;
    } catch (error) {
      this.backendStatus = 'offline';
      this.dbStatus = 'offline';
    }
  }

  async checkProductsCount(): Promise<void> {
    try {
      const res: any = await this.http.get('/api/products').toPromise();
      this.productsCount = res.data?.length || 0;
    } catch (error) {
      this.productsCount = 0;
    }
  }

  updateToken(token: string): void {
    this.currentToken = token;
  }

  showResult(id: string, data: any, isSuccess = true): void {
    this.results[id] = { data, isSuccess };
  }

  async testHealth(): Promise<void> {
    try {
      const response: any = await this.http.get('/api/health').toPromise();
      this.showResult('1', response, true);
    } catch (error: any) {
      this.showResult('1', { error: error.message }, false);
    }
  }

  async registerAdmin(): Promise<void> {
    try {
      const response: any = await this.http
        .post('/api/auth/register', {
          name: this.adminName,
          email: this.adminEmail,
          password: this.adminPassword,
          role: 'ADMIN',
        })
        .toPromise();
      if (response.data?.token) this.updateToken(response.data.token);
      this.showResult('2', response, true);
    } catch (error: any) {
      this.showResult('2', { error: error.message }, false);
    }
  }

  async registerClient(): Promise<void> {
    try {
      const response: any = await this.http
        .post('/api/auth/register', {
          name: this.clientName,
          email: this.clientEmail,
          password: this.clientPassword,
        })
        .toPromise();
      if (response.data?.token) this.updateToken(response.data.token);
      this.showResult('3', response, true);
    } catch (error: any) {
      this.showResult('3', { error: error.message }, false);
    }
  }

  async login(): Promise<void> {
    try {
      const response: any = await this.http
        .post('/api/auth/login', {
          email: this.loginEmail,
          password: this.loginPassword,
        })
        .toPromise();
      if (response.data?.token) this.updateToken(response.data.token);
      this.showResult('4', response, true);
    } catch (error: any) {
      this.showResult('4', { error: error.message }, false);
    }
  }

  async getProfile(): Promise<void> {
    if (!this.currentToken) {
      this.showResult('5', { error: 'Faça login primeiro' }, false);
      return;
    }

    try {
      const response: any = await this.http
        .get('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.currentToken}` },
        })
        .toPromise();
      this.showResult('5', response, true);
    } catch (error: any) {
      this.showResult('5', { error: error.message }, false);
    }
  }

  async logout(): Promise<void> {
    if (!this.currentToken) {
      this.showResult('6', { error: 'Faça login primeiro' }, false);
      return;
    }

    try {
      const response: any = await this.http
        .post(
          '/api/auth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${this.currentToken}` },
          }
        )
        .toPromise();
      this.currentToken = null;
      this.showResult('6', response, true);
    } catch (error: any) {
      this.showResult('6', { error: error.message }, false);
    }
  }

  copyMongoURL(): void {
    navigator.clipboard.writeText(this.mongoUri);
    alert('MongoDB URL copiada!\n\n' + this.mongoUri);
  }
}
