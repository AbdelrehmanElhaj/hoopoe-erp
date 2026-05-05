import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Divider } from 'primeng/divider';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink, DecimalPipe,
    Card, Button, Tag, Skeleton, Divider
  ],
  template: `
    <div class="dash-page" dir="rtl">

      @if (loading()) {
        <div class="kpi-grid">
          @for (_ of [1,2,3,4]; track _) {
            <p-skeleton height="100px" borderRadius="12px" />
          }
        </div>
      }

      @if (data(); as d) {

        <!-- Header -->
        <div class="dash-header">
          <div>
            <h1 class="dash-title">لوحة التحكم</h1>
            <p class="dash-sub">نظرة عامة على النشاط المحاسبي</p>
          </div>
          <div class="header-actions">
            <p-button label="فاتورة جديدة" icon="pi pi-plus" iconPos="right"
                      severity="contrast" [routerLink]="['/invoices/new']" />
            <p-button label="قيد جديد" icon="pi pi-plus" iconPos="right"
                      [outlined]="true" [routerLink]="['/journal/new']" />
          </div>
        </div>

        <!-- KPI cards -->
        <div class="kpi-grid">

          <div class="kpi-card kpi-blue">
            <div class="kpi-icon"><i class="pi pi-arrow-up-right"></i></div>
            <div class="kpi-body">
              <div class="kpi-label">إيرادات الشهر</div>
              <div class="kpi-value">{{ d.invoiceStats.monthRevenue | number:'1.2-2' }}</div>
              <div class="kpi-sub">ر.س (صافي قبل الضريبة)</div>
            </div>
          </div>

          <div class="kpi-card kpi-green">
            <div class="kpi-icon"><i class="pi pi-file-check"></i></div>
            <div class="kpi-body">
              <div class="kpi-label">فواتير الشهر</div>
              <div class="kpi-value">{{ d.invoiceStats.monthCount }}</div>
              <div class="kpi-sub">من إجمالي {{ d.invoiceStats.totalCount }} فاتورة</div>
            </div>
          </div>

          <div class="kpi-card kpi-orange">
            <div class="kpi-icon"><i class="pi pi-percentage"></i></div>
            <div class="kpi-body">
              <div class="kpi-label">ضريبة القيمة المضافة</div>
              <div class="kpi-value">{{ d.invoiceStats.monthVat | number:'1.2-2' }}</div>
              <div class="kpi-sub">ر.س الشهر الحالي</div>
            </div>
          </div>

          <div class="kpi-card kpi-purple">
            <div class="kpi-icon"><i class="pi pi-book"></i></div>
            <div class="kpi-body">
              <div class="kpi-label">القيود اليومية</div>
              <div class="kpi-value">{{ d.journalStats.totalCount }}</div>
              <div class="kpi-sub">{{ d.journalStats.postedCount }} مرحَّل · {{ d.journalStats.draftCount }} مسودة</div>
            </div>
          </div>

        </div>

        <!-- Status cards row -->
        <div class="mid-grid">

          <!-- Invoice status -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="card-head">
                <div class="card-head-icon blue"><i class="pi pi-file-check"></i></div>
                <div>
                  <div class="card-head-title">حالة الفواتير</div>
                </div>
              </div>
            </ng-template>

            <div class="stat-list">
              <div class="stat-row">
                <span><span class="dot dot-grey"></span>مسودة</span>
                <strong>{{ d.invoiceStats.draftCount }}</strong>
              </div>
              <div class="stat-row">
                <span><span class="dot dot-green"></span>مؤكدة</span>
                <strong>{{ d.invoiceStats.confirmedCount }}</strong>
              </div>
              <p-divider />
              <div class="stat-row total">
                <span>الإجمالي</span>
                <strong>{{ d.invoiceStats.totalCount }}</strong>
              </div>
            </div>

            <ng-template pTemplate="footer">
              <p-button label="عرض كل الفواتير" [link]="true" icon="pi pi-arrow-left"
                        iconPos="left" [routerLink]="['/invoices']" />
            </ng-template>
          </p-card>

          <!-- ZATCA status -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="card-head">
                <div class="card-head-icon green"><i class="pi pi-qrcode"></i></div>
                <div>
                  <div class="card-head-title">حالة ZATCA</div>
                  <div class="card-head-sub">الفواتير المؤكدة فقط</div>
                </div>
              </div>
            </ng-template>

            <div class="stat-list">
              <div class="stat-row">
                <span><span class="dot dot-grey"></span>لم ترسل</span>
                <strong>{{ d.zatcaStats.notSubmitted }}</strong>
              </div>
              <div class="stat-row">
                <span><span class="dot dot-yellow"></span>قيد الإرسال</span>
                <strong>{{ d.zatcaStats.pending }}</strong>
              </div>
              <div class="stat-row">
                <span><span class="dot dot-green"></span>مُخلَّصة</span>
                <strong>{{ d.zatcaStats.cleared }}</strong>
              </div>
              <div class="stat-row">
                <span><span class="dot dot-blue"></span>مُبلَّغ عنها</span>
                <strong>{{ d.zatcaStats.reported }}</strong>
              </div>
              @if (d.zatcaStats.rejected > 0) {
                <div class="stat-row warn">
                  <span><span class="dot dot-red"></span>مرفوضة</span>
                  <strong>{{ d.zatcaStats.rejected }}</strong>
                </div>
              }
            </div>

            <ng-template pTemplate="footer">
              <p-button label="إعداد ZATCA" [link]="true" icon="pi pi-arrow-left"
                        iconPos="left" [routerLink]="['/zatca']" />
            </ng-template>
          </p-card>

        </div>

        <!-- Recent invoices -->
        <p-card styleClass="recent-card">
          <ng-template pTemplate="header">
            <div class="card-head">
              <div class="card-head-icon blue"><i class="pi pi-history"></i></div>
              <div class="card-head-title">آخر الفواتير</div>
            </div>
          </ng-template>

          <div class="table-wrap">
            <div class="table-header inv-cols">
              <span>رقم الفاتورة</span>
              <span>المشتري</span>
              <span>النوع</span>
              <span class="num-col">الإجمالي (ر.س)</span>
              <span>الحالة</span>
            </div>

            @for (inv of d.recentInvoices; track inv.id) {
              <a class="table-row inv-cols" [routerLink]="['/invoices', inv.id]">
                <span class="mono-num">{{ inv.invoiceNumber }}</span>
                <span class="muted">{{ inv.buyerName || '—' }}</span>
                <span>
                  <p-tag [value]="inv.invoiceType === 'STANDARD' ? 'ضريبية' : 'مبسّطة'"
                         [severity]="inv.invoiceType === 'STANDARD' ? 'info' : 'secondary'" />
                </span>
                <span class="num-col amount">{{ inv.totalAmount | number:'1.2-2' }}</span>
                <span>
                  <p-tag [value]="statusLabel(inv.status)"
                         [severity]="invSeverity(inv.status)" />
                </span>
              </a>
            }

            @if (d.recentInvoices.length === 0) {
              <div class="empty">لا توجد فواتير بعد</div>
            }
          </div>

          <ng-template pTemplate="footer">
            <div class="card-footer-actions">
              <p-button label="عرض الكل" [link]="true" [routerLink]="['/invoices']" />
              <p-button label="فاتورة جديدة" icon="pi pi-plus" iconPos="right"
                        [routerLink]="['/invoices/new']" />
            </div>
          </ng-template>
        </p-card>

        <!-- Recent journal entries -->
        <p-card styleClass="recent-card">
          <ng-template pTemplate="header">
            <div class="card-head">
              <div class="card-head-icon purple"><i class="pi pi-book"></i></div>
              <div class="card-head-title">آخر القيود</div>
            </div>
          </ng-template>

          <div class="table-wrap">
            <div class="table-header je-cols">
              <span>رقم القيد</span>
              <span>البيان</span>
              <span class="num-col">إجمالي المدين</span>
              <span>الحالة</span>
            </div>

            @for (je of d.recentJournalEntries; track je.id) {
              <a class="table-row je-cols" [routerLink]="['/journal', je.id]">
                <span class="mono-num">{{ je.entryNumber }}</span>
                <span class="muted">{{ je.description }}</span>
                <span class="num-col amount">{{ je.totalDebit | number:'1.2-2' }}</span>
                <span>
                  <p-tag [value]="journalStatusLabel(je.status)"
                         [severity]="jeSeverity(je.status)" />
                </span>
              </a>
            }

            @if (d.recentJournalEntries.length === 0) {
              <div class="empty">لا توجد قيود بعد</div>
            }
          </div>

          <ng-template pTemplate="footer">
            <div class="card-footer-actions">
              <p-button label="عرض الكل" [link]="true" [routerLink]="['/journal']" />
              <p-button label="قيد جديد" icon="pi pi-plus" iconPos="right"
                        [routerLink]="['/journal/new']" />
            </div>
          </ng-template>
        </p-card>

      }
    </div>
  `,
  styles: [`
    .dash-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Header */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .dash-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: #1a237e; }
    .dash-sub   { margin: 4px 0 0; font-size: 0.88rem; color: #78909c; }

    .header-actions { display: flex; gap: 8px; }

    /* KPI cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .kpi-card {
      background: white;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
    }

    .kpi-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      i { font-size: 1.4rem; color: white; }
    }

    .kpi-blue   .kpi-icon { background: #1a237e; }
    .kpi-green  .kpi-icon { background: #1b5e20; }
    .kpi-orange .kpi-icon { background: #e65100; }
    .kpi-purple .kpi-icon { background: #4a148c; }

    .kpi-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .kpi-label { font-size: 0.75rem; font-weight: 700; color: #78909c; text-transform: uppercase; letter-spacing: .5px; }
    .kpi-value { font-size: 1.7rem; font-weight: 800; color: #1a1a2e; line-height: 1.1; white-space: nowrap; }
    .kpi-sub   { font-size: 0.73rem; color: #b0bec5; }

    /* Mid grid */
    .mid-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* Card head */
    .card-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 0;
    }

    .card-head-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      i { font-size: 1rem; color: white; }

      &.blue   { background: #1a237e; }
      &.green  { background: #1b5e20; }
      &.purple { background: #4a148c; }
    }

    .card-head-title { font-weight: 700; font-size: 0.95rem; color: #1a237e; }
    .card-head-sub   { font-size: 0.78rem; color: #90a4ae; margin-top: 2px; }

    /* Stat list */
    .stat-list { display: flex; flex-direction: column; gap: 4px; }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;
      font-size: 0.88rem;
      color: #546e7a;

      span { display: flex; align-items: center; gap: 8px; }
      strong { font-size: 1rem; color: #1a1a2e; }

      &.total { border-bottom: none; font-weight: 700; color: #1a1a2e; }
      &.warn strong { color: #c62828; }
    }

    /* Dots */
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .dot-grey   { background: #90a4ae; }
    .dot-green  { background: #43a047; }
    .dot-yellow { background: #fb8c00; }
    .dot-blue   { background: #1e88e5; }
    .dot-red    { background: #e53935; }

    /* Tables */
    .table-wrap { border-radius: 8px; overflow: hidden; }

    .table-header {
      display: grid;
      gap: 12px;
      align-items: center;
      padding: 8px 12px;
      background: #f5f7fb;
      font-size: 0.75rem;
      font-weight: 700;
      color: #78909c;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .table-row {
      display: grid;
      gap: 12px;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid #f5f5f5;
      text-decoration: none;
      color: inherit;
      transition: background .15s;
      &:hover { background: #f9f9ff; }
    }

    .inv-cols { grid-template-columns: 150px 1fr 90px 130px 90px; }
    .je-cols  { grid-template-columns: 160px 1fr 140px 90px; }

    .mono-num { font-weight: 700; color: #1a237e; font-family: monospace; font-size: 0.88rem; }
    .muted    { color: #90a4ae; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .num-col  { text-align: left; direction: ltr; }
    .amount   { font-family: monospace; font-weight: 600; color: #1b5e20; }

    .card-footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .empty {
      text-align: center;
      padding: 32px;
      color: #b0bec5;
      font-size: 0.9rem;
    }

    @media (max-width: 960px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .mid-grid { grid-template-columns: 1fr; }
      .inv-cols { grid-template-columns: 130px 1fr 110px 90px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private svc = inject(DashboardService);

  data    = signal<DashboardData | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.svc.getDashboard().subscribe({
      next: res => { this.data.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', CONFIRMED: 'مؤكدة', CANCELLED: 'ملغاة' } as Record<string, string>)[s] ?? s;
  }

  journalStatusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', POSTED: 'مرحَّل', VOID: 'ملغى' } as Record<string, string>)[s] ?? s;
  }

  invSeverity(s: string): 'success' | 'danger' | 'secondary' | 'warn' {
    return ({ DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' } as Record<string, any>)[s] ?? 'secondary';
  }

  jeSeverity(s: string): 'success' | 'danger' | 'secondary' {
    return ({ DRAFT: 'secondary', POSTED: 'success', VOID: 'danger' } as Record<string, any>)[s] ?? 'secondary';
  }
}
