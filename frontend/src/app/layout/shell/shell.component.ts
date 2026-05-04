import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="shell-container">

      <!-- Sidebar -->
      <mat-sidenav mode="side" opened class="shell-sidenav">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">account_balance</mat-icon>
          <span class="logo-text">المحاسبة السعودية</span>
        </div>

        <mat-divider />

        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item
               [routerLink]="item.route"
               routerLinkActive="active-link"
               [routerLinkActiveOptions]="{ exact: false }">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <mat-divider />

        <div class="sidenav-footer">
          <small class="tenant-badge">{{ auth.getTenantId() }}</small>
        </div>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content class="shell-content">

        <!-- Top toolbar -->
        <mat-toolbar color="primary" class="shell-toolbar">
          <span class="toolbar-spacer"></span>

          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <strong>{{ auth.currentUser()?.fullName }}</strong>
              <small>{{ auth.currentUser()?.email }}</small>
            </div>
            <mat-divider />
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              <span>تسجيل الخروج</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <!-- Page content -->
        <div class="content-wrapper">
          <router-outlet />
        </div>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }

    .shell-sidenav {
      width: 240px;
      background: #1a237e;
      color: white;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      .logo-icon { color: #ffd740; font-size: 32px; }
      .logo-text { font-size: 1rem; font-weight: 700; color: white; }
    }

    mat-nav-list a {
      color: rgba(255,255,255,.8) !important;
      margin: 2px 8px;
      border-radius: 8px;
      &:hover { background: rgba(255,255,255,.1) !important; }
    }

    .active-link {
      background: rgba(255,255,255,.2) !important;
      color: white !important;
      border-right: 4px solid #ffd740 !important;
    }

    mat-icon[matListItemIcon] { color: rgba(255,255,255,.7); }

    .sidenav-footer {
      padding: 12px 16px;
      .tenant-badge {
        background: rgba(255,255,255,.15);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        color: rgba(255,255,255,.8);
      }
    }

    .shell-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }

    .toolbar-spacer { flex: 1; }

    .content-wrapper { padding: 0; }

    .user-menu-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      small { color: #666; }
    }
  `]
})
export class ShellComponent {
  auth = inject(AuthService);

  navItems: NavItem[] = [
    { icon: 'dashboard',      label: 'لوحة التحكم',       route: '/dashboard' },
    { icon: 'receipt_long',   label: 'الفواتير',          route: '/invoices' },
    { icon: 'people',         label: 'العملاء والموردون', route: '/contacts' },
    { icon: 'account_tree',   label: 'دليل الحسابات',     route: '/accounts' },
    { icon: 'book',           label: 'القيود اليومية',    route: '/journal' },
    { icon: 'bar_chart',      label: 'التقارير',          route: '/reports' },
    { icon: 'qr_code_2',      label: 'ZATCA',             route: '/zatca' },
    { icon: 'settings',       label: 'إعدادات الشركة',   route: '/settings' },
  ];
}
