import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly TENANT_KEY = 'tenant_id';

  currentUser = signal<LoginResponse | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem(this.TOKEN_KEY);
    if (stored) {
      // Restore session on reload
      const tenantId = localStorage.getItem(this.TENANT_KEY) ?? '';
      // Parse JWT payload to restore user info
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        this.currentUser.set({
          accessToken: stored,
          refreshToken: '',
          expiresIn: 0,
          userId: payload.sub,
          email: payload.email,
          fullName: '',
          role: payload.role,
          tenantId
        });
      } catch {
        this.logout();
      }
    }
  }

  login(email: string, password: string, tenantId: string): Observable<{ data: LoginResponse }> {
    return this.http.post<{ data: LoginResponse }>('/api/auth/login', { email, password }, {
      headers: new HttpHeaders({ 'X-Tenant-ID': tenantId })
    }).pipe(
      tap(response => {
        const user = response.data;
        localStorage.setItem(this.TOKEN_KEY, user.accessToken);
        localStorage.setItem(this.TENANT_KEY, user.tenantId);
        this.currentUser.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TENANT_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getTenantId(): string {
    return localStorage.getItem(this.TENANT_KEY) ?? '';
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }
}
