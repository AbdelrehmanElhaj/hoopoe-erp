import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

const REPORTS = [
  { icon: 'balance',      title: 'ميزان المراجعة',            desc: 'عرض أرصدة جميع الحسابات',        route: 'trial-balance', soon: false },
  { icon: 'trending_up',  title: 'قائمة الدخل',               desc: 'الإيرادات والمصروفات',            route: 'income-statement', soon: false },
  { icon: 'account_tree', title: 'الميزانية العمومية',         desc: 'الأصول والخصوم وحقوق الملكية',   route: 'balance-sheet',    soon: false },
  { icon: 'receipt',      title: 'تقرير ضريبة القيمة المضافة', desc: 'للفترة الضريبية - ZATCA',         route: 'vat',           soon: false },
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <h1>التقارير</h1>
      </div>

      <div class="reports-grid">
        @for (r of reports; track r.title) {
          <mat-card class="report-card" [class.disabled]="r.soon">
            <mat-card-content>
              <mat-icon class="report-icon">{{ r.icon }}</mat-icon>
              <h3>{{ r.title }}</h3>
              <p>{{ r.desc }}</p>
              @if (r.soon) {
                <span class="soon-badge">قريباً</span>
              } @else {
                <button mat-flat-button color="primary" [routerLink]="r.route">عرض التقرير</button>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; direction: rtl; }
    .reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .report-card { cursor: pointer; transition: transform .2s; }
    .report-card:not(.disabled):hover { transform: translateY(-2px); }
    .report-card.disabled { opacity: .5; pointer-events: none; }
    .report-icon { font-size: 40px; height: 40px; width: 40px; color: #1a237e; margin-bottom: 12px; }
    h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 700; }
    p { color: #546e7a; margin: 0 0 16px; font-size: 0.9rem; }
    .soon-badge { background: #fff8e1; color: #e65100; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; }
  `]
})
export class ReportsComponent {
  reports = REPORTS;
}
