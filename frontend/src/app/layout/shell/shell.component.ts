import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { Ripple } from 'primeng/ripple';
import { Toast } from 'primeng/toast';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    Avatar, Ripple, Toast
  ],
  template: `
    <p-toast />

    <div class="shell-layout">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon"><i class="pi pi-building-columns"></i></span>
          <span class="brand-name">المحاسبة السعودية</span>
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="nav-item--active"
               [routerLinkActiveOptions]="{ exact: false }"
               pRipple>
              <i class="nav-icon pi {{ item.icon }}"></i>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <span class="tenant-chip">{{ auth.getTenantId() }}</span>
        </div>
      </aside>

      <!-- Main area -->
      <div class="main-area">

        <!-- Top bar -->
        <header class="topbar">
          <span class="topbar-spacer"></span>

          <div class="topbar-user" (click)="userMenuOpen = !userMenuOpen">
            <p-avatar
              [label]="userInitials()"
              styleClass="avatar"
              shape="circle"
              size="normal" />
            <span class="user-name">{{ auth.currentUser()?.fullName }}</span>
            <i class="pi pi-angle-down"></i>
          </div>

          @if (userMenuOpen) {
            <div class="user-dropdown" (click)="userMenuOpen = false">
              <div class="user-info">
                <strong>{{ auth.currentUser()?.fullName }}</strong>
                <small>{{ auth.currentUser()?.email }}</small>
              </div>
              <hr />
              <button class="logout-btn" (click)="auth.logout()">
                <i class="pi pi-sign-out"></i>
                تسجيل الخروج
              </button>
            </div>
          }
        </header>

        <!-- Page content -->
        <main class="page-content">
          <router-outlet />
        </main>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      background: #1a237e;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,.12);

      .brand-icon {
        width: 36px;
        height: 36px;
        background: rgba(255,213,79,.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        i { color: #ffd54f; font-size: 1.1rem; }
      }

      .brand-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: white;
        white-space: nowrap;
      }
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      color: rgba(255,255,255,.75);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 2px;
      transition: background .15s, color .15s;
      cursor: pointer;

      &:hover { background: rgba(255,255,255,.1); color: white; }
    }

    .nav-item--active {
      background: rgba(255,255,255,.18) !important;
      color: white !important;
      border-inline-end: 3px solid #ffd54f;

      .nav-icon { color: #ffd54f; }
    }

    .nav-icon { font-size: 1rem; width: 20px; text-align: center; }
    .nav-label { flex: 1; }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,.12);

      .tenant-chip {
        background: rgba(255,255,255,.12);
        color: rgba(255,255,255,.8);
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 12px;
      }
    }

    /* ── Main area ── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .topbar {
      height: 60px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 12px;
      position: relative;
      flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }

    .topbar-spacer { flex: 1; }

    .topbar-user {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      transition: background .15s;
      &:hover { background: #f5f5f5; }

      .user-name { font-size: 0.88rem; font-weight: 600; color: #333; }
      i { font-size: 0.75rem; color: #666; }
    }

    ::ng-deep .avatar {
      background: #1a237e !important;
      color: white !important;
      font-weight: 700 !important;
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 16px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
      min-width: 200px;
      z-index: 200;
      overflow: hidden;

      .user-info {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        strong { font-size: 0.9rem; color: #1a237e; }
        small { color: #888; font-size: 0.8rem; }
      }

      hr { margin: 0; border: none; border-top: 1px solid #f0f0f0; }

      .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border: none;
        background: none;
        cursor: pointer;
        color: #c62828;
        font-family: 'Cairo', sans-serif;
        font-size: 0.88rem;
        font-weight: 600;
        transition: background .15s;
        &:hover { background: #ffebee; }
        i { font-size: 0.9rem; }
      }
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      background: #f5f7fb;
    }
  `]
})
export class ShellComponent {
  auth = inject(AuthService);
  userMenuOpen = false;

  navItems: NavItem[] = [
    { icon: 'pi-home',        label: 'لوحة التحكم',       route: '/dashboard' },
    { icon: 'pi-file-check',  label: 'الفواتير',          route: '/invoices' },
    { icon: 'pi-users',       label: 'العملاء والموردون', route: '/contacts' },
    { icon: 'pi-sitemap',     label: 'دليل الحسابات',     route: '/accounts' },
    { icon: 'pi-book',        label: 'القيود اليومية',    route: '/journal' },
    { icon: 'pi-chart-bar',   label: 'التقارير',          route: '/reports' },
    { icon: 'pi-qrcode',      label: 'ZATCA',             route: '/zatca' },
    { icon: 'pi-cog',         label: 'إعدادات الشركة',   route: '/settings' },
  ];

  userInitials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }
}
