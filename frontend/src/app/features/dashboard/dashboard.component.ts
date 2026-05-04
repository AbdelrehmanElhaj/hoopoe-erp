import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink, DecimalPipe, DatePipe, CurrencyPipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatDividerModule
  ],
  template: `
    <div class="page-container" dir="rtl">
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (data(); as d) {

        <!-- Header -->
        <div class="page-header">
          <div>
            <h1>لوحة التحكم</h1>
            <p class="sub">نظرة عامة على النشاط المحاسبي</p>
          </div>
          <div class="header-actions">
            <a mat-flat-button color="primary" routerLink="/invoices/new">
              <mat-icon>add</mat-icon> فاتورة جديدة
            </a>
            <a mat-stroked-button routerLink="/journal/new">
              <mat-icon>add</mat-icon> قيد جديد
            </a>
          </div>
        </div>

        <!-- Revenue KPIs -->
        <div class="kpi-grid">
          <mat-card class="kpi-card accent-blue">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
              <div class="kpi-body">
                <div class="kpi-label">إيرادات الشهر</div>
                <div class="kpi-value">{{ d.invoiceStats.monthRevenue | number:'1.2-2' }}</div>
                <div class="kpi-sub">ر.س (صافي قبل الضريبة)</div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card accent-green">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>receipt_long</mat-icon></div>
              <div class="kpi-body">
                <div class="kpi-label">فواتير الشهر</div>
                <div class="kpi-value">{{ d.invoiceStats.monthCount }}</div>
                <div class="kpi-sub">من إجمالي {{ d.invoiceStats.totalCount }} فاتورة</div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card accent-orange">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>account_balance</mat-icon></div>
              <div class="kpi-body">
                <div class="kpi-label">ضريبة القيمة المضافة (الشهر)</div>
                <div class="kpi-value">{{ d.invoiceStats.monthVat | number:'1.2-2' }}</div>
                <div class="kpi-sub">ر.س · إجمالي {{ d.invoiceStats.totalVat | number:'1.2-2' }} ر.س</div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card accent-purple">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>book</mat-icon></div>
              <div class="kpi-body">
                <div class="kpi-label">القيود اليومية</div>
                <div class="kpi-value">{{ d.journalStats.totalCount }}</div>
                <div class="kpi-sub">{{ d.journalStats.postedCount }} مرحَّل · {{ d.journalStats.draftCount }} مسودة</div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Invoice status + ZATCA status -->
        <div class="mid-grid">

          <!-- Invoice status breakdown -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar class="card-icon blue">receipt_long</mat-icon>
              <mat-card-title>حالة الفواتير</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-row">
                <span class="stat-label"><span class="dot dot-grey"></span>مسودة</span>
                <span class="stat-value">{{ d.invoiceStats.draftCount }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label"><span class="dot dot-green"></span>مؤكدة</span>
                <span class="stat-value">{{ d.invoiceStats.confirmedCount }}</span>
              </div>
              <mat-divider class="divider" />
              <div class="stat-row total-row">
                <span class="stat-label">الإجمالي</span>
                <span class="stat-value">{{ d.invoiceStats.totalCount }}</span>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button routerLink="/invoices">عرض كل الفواتير</a>
            </mat-card-actions>
          </mat-card>

          <!-- ZATCA status breakdown -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar class="card-icon green">qr_code_2</mat-icon>
              <mat-card-title>حالة ZATCA</mat-card-title>
              <mat-card-subtitle>الفواتير المؤكدة فقط</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-row">
                <span class="stat-label"><span class="dot dot-grey"></span>لم ترسل</span>
                <span class="stat-value">{{ d.zatcaStats.notSubmitted }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label"><span class="dot dot-yellow"></span>قيد الإرسال</span>
                <span class="stat-value">{{ d.zatcaStats.pending }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label"><span class="dot dot-green"></span>مُخلَّصة</span>
                <span class="stat-value">{{ d.zatcaStats.cleared }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label"><span class="dot dot-blue"></span>مُبلَّغ عنها</span>
                <span class="stat-value">{{ d.zatcaStats.reported }}</span>
              </div>
              @if (d.zatcaStats.rejected > 0) {
                <div class="stat-row">
                  <span class="stat-label"><span class="dot dot-red"></span>مرفوضة</span>
                  <span class="stat-value warn">{{ d.zatcaStats.rejected }}</span>
                </div>
              }
            </mat-card-content>
            <mat-card-actions>
              <a mat-button routerLink="/zatca">إعداد ZATCA</a>
            </mat-card-actions>
          </mat-card>

        </div>

        <!-- Recent invoices -->
        <mat-card class="recent-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon blue">history</mat-icon>
            <mat-card-title>آخر الفواتير</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="list-header recent-row">
              <span>رقم الفاتورة</span>
              <span>المشتري</span>
              <span>النوع</span>
              <span class="amount-col">الإجمالي (ر.س)</span>
              <span>الحالة</span>
            </div>
            @for (inv of d.recentInvoices; track inv.id) {
              <a class="recent-row clickable" [routerLink]="['/invoices', inv.id]">
                <span class="inv-number">{{ inv.invoiceNumber }}</span>
                <span class="muted">{{ inv.buyerName || '—' }}</span>
                <span>
                  <span class="type-chip" [class]="inv.invoiceType === 'STANDARD' ? 'type-standard' : 'type-simplified'">
                    {{ inv.invoiceType === 'STANDARD' ? 'ضريبية' : 'مبسّطة' }}
                  </span>
                </span>
                <span class="amount-col amount">{{ inv.totalAmount | number:'1.2-2' }}</span>
                <span>
                  <span class="status-chip" [class]="'status-' + inv.status.toLowerCase()">
                    {{ statusLabel(inv.status) }}
                  </span>
                </span>
              </a>
            }
            @if (d.recentInvoices.length === 0) {
              <div class="empty">لا توجد فواتير بعد</div>
            }
          </mat-card-content>
          <mat-card-actions>
            <a mat-button routerLink="/invoices">عرض الكل</a>
            <a mat-button color="primary" routerLink="/invoices/new">فاتورة جديدة</a>
          </mat-card-actions>
        </mat-card>

        <!-- Recent journal entries -->
        <mat-card class="recent-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon purple">menu_book</mat-icon>
            <mat-card-title>آخر القيود</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="list-header journal-row">
              <span>رقم القيد</span>
              <span>البيان</span>
              <span class="amount-col">إجمالي المدين</span>
              <span>الحالة</span>
            </div>
            @for (je of d.recentJournalEntries; track je.id) {
              <a class="journal-row clickable" [routerLink]="['/journal', je.id]">
                <span class="inv-number">{{ je.entryNumber }}</span>
                <span class="muted">{{ je.description }}</span>
                <span class="amount-col amount">{{ je.totalDebit | number:'1.2-2' }}</span>
                <span>
                  <span class="status-chip" [class]="'status-' + je.status.toLowerCase()">
                    {{ journalStatusLabel(je.status) }}
                  </span>
                </span>
              </a>
            }
            @if (d.recentJournalEntries.length === 0) {
              <div class="empty">لا توجد قيود بعد</div>
            }
          </mat-card-content>
          <mat-card-actions>
            <a mat-button routerLink="/journal">عرض الكل</a>
            <a mat-button color="primary" routerLink="/journal/new">قيد جديد</a>
          </mat-card-actions>
        </mat-card>

      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.6rem; }
    .sub { color: #546e7a; margin: 4px 0 0; font-size: 0.9rem; }
    .header-actions { display: flex; gap: 8px; }

    /* KPI cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center;
                justify-content: center; flex-shrink: 0;
                mat-icon { font-size: 26px; width: 26px; height: 26px; color: white; } }
    .kpi-body { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { font-size: 0.78rem; color: #546e7a; font-weight: 600; text-transform: uppercase; }
    .kpi-value { font-size: 1.6rem; font-weight: 800; color: #1a1a2e; line-height: 1.1; }
    .kpi-sub   { font-size: 0.75rem; color: #90a4ae; }

    .accent-blue   .kpi-icon { background: #1a237e; }
    .accent-green  .kpi-icon { background: #1b5e20; }
    .accent-orange .kpi-icon { background: #e65100; }
    .accent-purple .kpi-icon { background: #4a148c; }

    /* Mid grid */
    .mid-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .card-icon { border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .card-icon.blue   { background: #e8eaf6; color: #1a237e; }
    .card-icon.green  { background: #e8f5e9; color: #1b5e20; }
    .card-icon.purple { background: #f3e5f5; color: #4a148c; }

    .stat-row { display: flex; justify-content: space-between; align-items: center;
                padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
    .stat-label { display: flex; align-items: center; gap: 8px; color: #455a64; font-size: 0.9rem; }
    .stat-value { font-weight: 700; font-size: 1rem; }
    .warn { color: #c62828; }
    .total-row .stat-label { font-weight: 700; color: #1a1a2e; }
    .divider { margin: 4px 0; }

    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot-grey   { background: #90a4ae; }
    .dot-green  { background: #43a047; }
    .dot-yellow { background: #fb8c00; }
    .dot-blue   { background: #1e88e5; }
    .dot-red    { background: #e53935; }

    /* Recent lists */
    .recent-card { margin-bottom: 20px; }
    .list-header { font-size: 0.78rem; font-weight: 700; color: #546e7a;
                   text-transform: uppercase; background: #f5f5f5;
                   border-radius: 6px; padding: 8px 12px; }

    .recent-row  { display: grid; grid-template-columns: 150px 1fr 100px 130px 100px; gap: 12px;
                   align-items: center; }
    .journal-row { display: grid; grid-template-columns: 160px 1fr 150px 100px; gap: 12px;
                   align-items: center; }

    .clickable { display: grid; padding: 10px 12px; border-bottom: 1px solid #f5f5f5;
                 text-decoration: none; color: inherit; transition: background .15s;
                 &:hover { background: #f9f9ff; } }

    .inv-number { font-weight: 600; color: #1a237e; font-family: monospace; font-size: 0.9rem; }
    .muted { color: #78909c; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .amount-col { text-align: left; direction: ltr; }
    .amount { font-family: monospace; font-weight: 600; color: #1b5e20; }

    .status-chip { padding: 3px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .status-draft     { background: #fff8e1; color: #f57f17; }
    .status-confirmed { background: #e8f5e9; color: #1b5e20; }
    .status-cancelled { background: #ffebee; color: #b71c1c; }
    .status-posted    { background: #e8f5e9; color: #1b5e20; }
    .status-void      { background: #ffebee; color: #b71c1c; }

    .type-chip { padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .type-standard   { background: #e8eaf6; color: #1a237e; }
    .type-simplified { background: #f3e5f5; color: #4a148c; }

    .empty { text-align: center; padding: 32px; color: #999; font-size: 0.9rem; }

    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .mid-grid { grid-template-columns: 1fr; }
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
}
