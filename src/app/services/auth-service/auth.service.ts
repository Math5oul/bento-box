import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Erro ao carregar usuário do storage:', error);
        this.logout();
      }
    }
  }

  login(token: string, user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Remove tokens de sessão anônima após login
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('tableId');
      localStorage.removeItem('tableNumber');
    }
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem('auth_token');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword,
          confirmPassword: newPassword,
        },
        { headers }
      )
      .toPromise();
  }

  /**
   * Verifica se existe uma sessão anônima ativa
   */
  hasAnonymousSession(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const sessionToken = localStorage.getItem('sessionToken');
    return !!sessionToken;
  }

  /**
   * Obtém informações da sessão anônima
   */
  getAnonymousSession(): { sessionToken: string; tableId: string; tableNumber: string } | null {
    if (!this.isBrowser) {
      return null;
    }

    const sessionToken = localStorage.getItem('sessionToken');
    const tableId = localStorage.getItem('tableId');
    const tableNumber = localStorage.getItem('tableNumber');

    if (sessionToken && tableId && tableNumber) {
      return { sessionToken, tableId, tableNumber };
    }

    return null;
  }

  /**
   * Converte sessão anônima fazendo login
   */
  async convertAnonymousWithLogin(email: string, password: string): Promise<any> {
    const session = this.getAnonymousSession();

    if (!session) {
      throw new Error('Nenhuma sessão anônima encontrada');
    }

    try {
      const response = await this.http
        .post('/api/auth/convert-anonymous', {
          sessionToken: session.sessionToken,
          action: 'login',
          loginData: { email, password },
        })
        .toPromise();

      // Atualiza estado de autenticação
      if (response && (response as any).success) {
        const { token, user } = response as any;
        this.login(token, user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Converte sessão anônima fazendo registro
   */
  async convertAnonymousWithRegister(name: string, email: string, password: string): Promise<any> {
    const session = this.getAnonymousSession();

    if (!session) {
      throw new Error('Nenhuma sessão anônima encontrada');
    }

    try {
      const response = await this.http
        .post('/api/auth/convert-anonymous', {
          sessionToken: session.sessionToken,
          action: 'register',
          registerData: { name, email, password },
        })
        .toPromise();

      // Atualiza estado de autenticação
      if (response && (response as any).success) {
        const { token, user } = response as any;
        this.login(token, user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}
