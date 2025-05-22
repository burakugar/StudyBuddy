// /src/app/modules/sessions/session-list/session-list.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { StudySessionDto } from '../../../core/models/study-session.models';
import { StudySessionService } from '../../../core/services/study-session.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionListComponent implements OnInit, OnDestroy {
  sessions: StudySessionDto[] = [];
  isLoading = false;
  error: string | null = null;
  private sessionSubscription: Subscription | null = null;

  constructor(
    private sessionService: StudySessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  ngOnDestroy(): void {
    this.sessionSubscription?.unsubscribe();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();
    this.sessionSubscription?.unsubscribe();

    this.sessionSubscription = this.sessionService.getAllPublicSessions()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.sessions = data;

          this.sessions.sort((a, b) => {
            const getTimeValue = (date: Date | undefined): number => {
              if (date instanceof Date && !isNaN(date.getTime())) {
                return date.getTime();
              }
              return Infinity;
            };

            const timeA = getTimeValue(a.startTime);
            const timeB = getTimeValue(b.startTime);

            return timeA - timeB; 
          });

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Error loading public sessions:", err);
          this.error = err?.message || 'Failed to load available sessions.';
          this.cdr.markForCheck();
        }
      });
  }

  trackBySessionId(index: number, session: StudySessionDto): number {
    return session.id;
  }

  isUpcoming(startTime: Date | undefined): boolean {
    if (!startTime) return false;
    return startTime instanceof Date && !isNaN(startTime.getTime()) && startTime > new Date();
  }
}
