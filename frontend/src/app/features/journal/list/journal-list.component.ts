import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, DatePipe } from '@angular/common';
import { JournalService, JournalEntry } from '../../../core/services/journal.service';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatProgressBarModule, MatSnackBarModule, MatTooltipModule, DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>القيود اليومية</h1>
        <button mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          قيد جديد
        </button>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="entries()">

            <ng-container matColumnDef="number">
              <th mat-header-cell *matHeaderCellDef>رقم القيد</th>
              <td mat-cell *matCellDef="let e">
                <strong>{{ e.entryNumber }}</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>التاريخ</th>
              <td mat-cell *matCellDef="let e">{{ e.entryDate | date:'yyyy/MM/dd' }}</td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>البيان</th>
              <td mat-cell *matCellDef="let e">{{ e.description }}</td>
            </ng-container>

            <ng-container matColumnDef="debit">
              <th mat-header-cell *matHeaderCellDef>إجمالي المدين</th>
              <td mat-cell *matCellDef="let e">
                <span class="amount amount-positive">{{ e.totalDebit | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="credit">
              <th mat-header-cell *matHeaderCellDef>إجمالي الدائن</th>
              <td mat-cell *matCellDef="let e">
                <span class="amount">{{ e.totalCredit | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>الحالة</th>
              <td mat-cell *matCellDef="let e">
                <span class="status-chip" [class]="'status-' + e.status.toLowerCase()">
                  {{ statusLabel(e.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let e" class="actions-cell">
                <a mat-icon-button [routerLink]="['/journal', e.id]" matTooltip="عرض">
                  <mat-icon>visibility</mat-icon>
                </a>
                @if (e.status === 'DRAFT') {
                  <button mat-stroked-button color="primary" (click)="post(e.id)" class="action-btn">
                    <mat-icon>publish</mat-icon> ترحيل
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>

            @if (entries().length === 0 && !loading()) {
              <tr class="mat-row">
                <td [attr.colspan]="columns.length" style="text-align:center;padding:48px;color:#999">
                  لا توجد قيود بعد
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
    .action-btn { height: 32px; font-size: 0.8rem; }
    .actions-cell { display: flex; align-items: center; gap: 4px; }
  `]
})
export class JournalListComponent implements OnInit {
  private journalService = inject(JournalService);
  private snackBar = inject(MatSnackBar);

  entries = signal<JournalEntry[]>([]);
  loading = signal(true);

  columns = ['number', 'date', 'description', 'debit', 'credit', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.journalService.findAll().subscribe({
      next: res => { this.entries.set(res.data.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  post(id: string): void {
    this.journalService.post(id).subscribe({
      next: res => {
        this.entries.update(list => list.map(e => e.id === id ? res.data : e));
        this.snackBar.open('تم ترحيل القيد بنجاح', 'إغلاق', { duration: 3000 });
      },
      error: err => this.snackBar.open(err.error?.message ?? 'حدث خطأ', 'إغلاق', { duration: 4000 })
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', POSTED: 'مرحّل', VOID: 'ملغى' } as Record<string,string>)[s] ?? s;
  }
}
