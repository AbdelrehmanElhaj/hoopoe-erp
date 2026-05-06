import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { JournalService, JournalEntry } from '../../../core/services/journal.service';

@Component({
  selector: 'app-journal-view',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, Button, Tag, Skeleton],
  template: `
    <div class="page-wrap" dir="rtl">

      @if (loading()) {
        <div class="skeleton-wrap">
          <p-skeleton height="40px" borderRadius="8px" />
          <p-skeleton height="24px" width="60%" borderRadius="8px" />
          <p-skeleton height="300px" borderRadius="12px" />
        </div>
      }

      @if (entry(); as e) {
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ e.entryNumber }}</h1>
            <p class="sub">{{ e.description }}</p>
          </div>
          <div class="header-actions">
            <p-button label="العودة" icon="pi pi-arrow-left" iconPos="right"
                      [outlined]="true" routerLink="/journal" />
            @if (e.status === 'DRAFT') {
              <p-button [label]="posting() ? 'جارٍ الترحيل...' : 'ترحيل القيد'"
                        icon="pi pi-check-circle" iconPos="right"
                        [loading]="posting()"
                        (onClick)="post(e.id)" />
            }
          </div>
        </div>

        <!-- Meta row -->
        <div class="meta-row">
          <p-tag [value]="statusLabel(e.status)"
                 [severity]="statusSeverity(e.status)"
                 [rounded]="true" />
          <span class="meta-item">
            <i class="pi pi-calendar"></i>
            {{ e.entryDate | date:'yyyy/MM/dd' }}
          </span>
          @if (e.postedAt) {
            <span class="meta-item">
              <i class="pi pi-clock"></i>
              رُحِّل {{ e.postedAt | date:'yyyy/MM/dd HH:mm' }}
            </span>
          }
        </div>

        <!-- Lines table -->
        <div class="lines-card">
          <div class="lines-card-title">بنود القيد</div>
          <div class="lines-table">
            <div class="line-row header-row">
              <span class="col-num">#</span>
              <span class="col-code">كود</span>
              <span class="col-name">الحساب</span>
              <span class="col-amount">مدين</span>
              <span class="col-amount">دائن</span>
              <span class="col-desc">البيان</span>
            </div>
            @for (line of e.lines; track line.id) {
              <div class="line-row">
                <span class="col-num">{{ line.lineNumber }}</span>
                <span class="col-code"><span class="acc-code">{{ line.accountCode }}</span></span>
                <span class="col-name">{{ line.accountNameAr }}</span>
                <span class="col-amount debit">
                  {{ line.debit > 0 ? (line.debit | number:'1.2-2') : '—' }}
                </span>
                <span class="col-amount credit">
                  {{ line.credit > 0 ? (line.credit | number:'1.2-2') : '—' }}
                </span>
                <span class="col-desc muted">{{ line.description ?? '' }}</span>
              </div>
            }
            <div class="line-row totals-row">
              <span class="col-num"></span>
              <span class="col-code"></span>
              <span class="col-name total-label">الإجمالي</span>
              <span class="col-amount debit">{{ e.totalDebit | number:'1.2-2' }}</span>
              <span class="col-amount credit">{{ e.totalCredit | number:'1.2-2' }}</span>
              <span class="col-desc"></span>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 900px; margin: 0 auto; }

    .skeleton-wrap { display: flex; flex-direction: column; gap: 12px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }
    .sub { color: #546e7a; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; }

    .meta-row {
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .meta-item {
      display: flex; align-items: center; gap: 6px;
      color: #546e7a; font-size: 0.9rem;
    }
    .meta-item i { font-size: 14px; }

    .lines-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 20px; margin-top: 8px;
    }
    .lines-card-title { font-size: 1rem; font-weight: 700; color: #1a237e; margin-bottom: 16px; }

    .lines-table { display: flex; flex-direction: column; font-size: 0.9rem; direction: rtl; }
    .line-row {
      display: grid;
      grid-template-columns: 40px 90px 1fr 130px 130px 1fr;
      gap: 8px; padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
    }
    .header-row {
      font-weight: 700; font-size: 0.8rem; color: #546e7a;
      background: #f5f7fb; border-radius: 6px 6px 0 0;
    }
    .totals-row { font-weight: 700; background: #f9f9f9; border-top: 2px solid #e0e0e0; }
    .total-label { color: #1a237e; }

    .col-amount { text-align: left; font-family: monospace; direction: ltr; }
    .acc-code {
      background: #e8eaf6; color: #1a237e; padding: 2px 6px;
      border-radius: 4px; font-size: 0.78rem; font-weight: 700; font-family: monospace;
    }
    .debit  { color: #1b5e20; }
    .credit { color: #1a237e; }
    .muted { color: #78909c; font-size: 0.85rem; }
  `]
})
export class JournalViewComponent implements OnInit {
  @Input() id!: string;

  private svc = inject(JournalService);
  private toast = inject(MessageService);

  entry   = signal<JournalEntry | null>(null);
  loading = signal(true);
  posting = signal(false);

  ngOnInit(): void {
    this.svc.findById(this.id).subscribe({
      next: res => { this.entry.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  post(id: string): void {
    this.posting.set(true);
    this.svc.post(id).subscribe({
      next: res => {
        this.entry.set(res.data);
        this.posting.set(false);
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم ترحيل القيد بنجاح', life: 3000 });
      },
      error: err => {
        this.posting.set(false);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'فشل الترحيل', life: 4000 });
      }
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', POSTED: 'مرحَّل', VOID: 'ملغى' } as Record<string, string>)[s] ?? s;
  }

  statusSeverity(s: string): 'warn' | 'success' | 'danger' {
    return ({ DRAFT: 'warn', POSTED: 'success', VOID: 'danger' } as Record<string, any>)[s] ?? 'secondary';
  }
}
