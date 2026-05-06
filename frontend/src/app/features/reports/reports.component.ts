import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

const REPORTS = [
  { icon: 'pi pi-chart-bar',  title: 'ميزان المراجعة',            desc: 'عرض أرصدة جميع الحسابات',        route: 'trial-balance',    soon: false },
  { icon: 'pi pi-chart-line', title: 'قائمة الدخل',               desc: 'الإيرادات والمصروفات',            route: 'income-statement', soon: false },
  { icon: 'pi pi-sitemap',    title: 'الميزانية العمومية',         desc: 'الأصول والخصوم وحقوق الملكية',   route: 'balance-sheet',    soon: false },
  { icon: 'pi pi-receipt',    title: 'تقرير ضريبة القيمة المضافة', desc: 'للفترة الضريبية - ZATCA',         route: 'vat',              soon: false },
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, Button],
  template: `
    <div class="page-wrap" dir="rtl">
      <div class="page-header">
        <h1 class="page-title">التقارير</h1>
      </div>

      <div class="reports-grid">
        @for (r of reports; track r.title) {
          <div class="report-card" [class.disabled]="r.soon">
            <i [class]="r.icon + ' report-icon'"></i>
            <h3>{{ r.title }}</h3>
            <p>{{ r.desc }}</p>
            @if (r.soon) {
              <span class="soon-badge">قريباً</span>
            } @else {
              <p-button label="عرض التقرير" icon="pi pi-arrow-left" iconPos="right"
                        [routerLink]="r.route" />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; direction: rtl; }
    .page-header { margin-bottom: 20px; }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    .reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

    .report-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 24px; cursor: pointer;
      transition: transform .2s, box-shadow .2s;
    }
    .report-card:not(.disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(26,35,126,.12);
    }
    .report-card.disabled { opacity: .5; pointer-events: none; }

    .report-icon { font-size: 2.5rem; color: #1a237e; display: block; margin-bottom: 14px; }
    h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 700; color: #1a237e; }
    p { color: #546e7a; margin: 0 0 16px; font-size: 0.9rem; }
    .soon-badge {
      background: #fff8e1; color: #e65100;
      padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;
    }
  `]
})
export class ReportsComponent {
  reports = REPORTS;
}
