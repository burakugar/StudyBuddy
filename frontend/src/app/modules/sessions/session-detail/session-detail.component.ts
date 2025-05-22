import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, finalize, switchMap, Observable } from 'rxjs';
import { StudySessionDto } from '../../../core/models/study-session.models';
import { StudySessionService } from '../../../core/services/study-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  session: StudySessionDto | null = null;
  isLoading = true;
  error: string | null = null;
  isCreator = false;
  isParticipant = false;
  isProcessingAction = false;

  private routeSubscription: Subscription | null = null;
  private sessionSubscription: Subscription | null = null;
  private actionSubscription: Subscription | null = null;
  private currentUser: User | null = null;
  private sessionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: StudySessionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idParam = params.get('sessionId');
      if (idParam) {
        this.sessionId = parseInt(idParam, 10);
        if (!isNaN(this.sessionId)) {
          this.loadSessionDetails(this.sessionId);
        } else {
          this.handleErrorState('Invalid session ID provided.');
        }
      } else {
        this.handleErrorState('No session ID found in route.');
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.sessionSubscription?.unsubscribe();
    this.actionSubscription?.unsubscribe();
  }

  loadSessionDetails(id: number): void {
    this.isLoading = true;
    this.error = null;
    this.session = null;
    this.isCreator = false;
    this.isParticipant = false;
    this.cdr.markForCheck();

    this.sessionSubscription = this.sessionService.getSessionById(id)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data: StudySessionDto) => {
          this.session = data;
          this.checkUserStatus(data);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error("Error loading session details:", err);
          this.handleErrorState(err?.message || 'Failed to load session details.');
        }
      });
  }

  checkUserStatus(session: StudySessionDto | null): void {
    if (!session || !this.currentUser) {
      this.isCreator = false;
      this.isParticipant = false;
      return;
    }
    this.isCreator = session.creatorId === this.currentUser.id;
    this.isParticipant = session.participantIds.includes(this.currentUser.id);
  }

  handleErrorState(errorMessage: string): void {
    this.error = errorMessage;
    this.isLoading = false;
    this.session = null;
    this.cdr.markForCheck();
  }

  joinSession(): void {
    if (!this.sessionId || this.isProcessingAction || this.isParticipant) return;
    this.performAction(this.sessionService.joinSession(this.sessionId));
  }

  leaveSession(): void {
    if (!this.sessionId || this.isProcessingAction || !this.isParticipant || this.isCreator) return;
    this.performAction(this.sessionService.leaveSession(this.sessionId));
  }

  deleteSession(): void {
    if (!this.sessionId || this.isProcessingAction || !this.isCreator) return;

    if (confirm('Are you sure you want to delete this study session? This action cannot be undone.')) {
      this.isProcessingAction = true;
      this.error = null;
      this.cdr.markForCheck();

      this.actionSubscription = this.sessionService.deleteSession(this.sessionId)
        .pipe(finalize(() => {
          this.isProcessingAction = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            console.log('Session deleted successfully');
            this.router.navigate(['/sessions']);
          },
          error: (err: any) => {
            console.error("Error deleting session:", err);
            this.error = err?.message || 'Failed to delete session.';
            this.cdr.markForCheck();
          }
        });
    }
  }

  editSession(): void {
    if (this.sessionId && this.isCreator) {
      this.router.navigate(['/sessions', this.sessionId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/sessions']);
  }

  private performAction(actionObservable: Observable<StudySessionDto>): void {
    this.isProcessingAction = true;
    this.error = null;
    this.cdr.markForCheck();

    this.actionSubscription = actionObservable
      .pipe(finalize(() => {
        this.isProcessingAction = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (updatedSession: StudySessionDto) => {
          this.session = updatedSession;
          this.checkUserStatus(updatedSession);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error("Error performing session action:", err);
          this.error = err?.message || 'An error occurred. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }
}
