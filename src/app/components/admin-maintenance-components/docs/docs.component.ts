import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import router from '../../../../../backend/routes/auth';
import { RouterLink } from '@angular/router';

interface HealthInfo {
  frontendUrl?: string;
  db?: { host?: string };
}

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.scss',
})
export class DocsComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  frontendUrl = 'http://localhost:4200';
  backendUrl = 'http://localhost:3001';
  mongoHost = '—';
  tableUrl = 'http://localhost:4200/table/[id]';
  testHubUrl = 'http://localhost:3001/test-hub.html';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHealthInfo();
    }
  }

  private loadHealthInfo(): void {
    this.http.get<HealthInfo>(`${environment.apiUrl}/health`).subscribe({
      next: info => {
        this.frontendUrl = info.frontendUrl || this.frontendUrl;
        this.backendUrl = window.location.origin || this.backendUrl;
        this.mongoHost = info?.db?.host || this.mongoHost;
        this.tableUrl = `${this.frontendUrl}/table/[id]`;
        this.testHubUrl = `${this.backendUrl}/test-hub.html`;
      },
      error: () => {
        // Manter valores padrão
      },
    });
  }
}
