import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, finalize, switchMap, of, Observable } from 'rxjs';
import { StudySessionDto, UpdateStudySessionDto } from '../../../core/models/study-session.models';
import { StudySessionService } from '../../../core/services/study-session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-session-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './session-edit.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionEditComponent implements OnInit, OnDestroy {
  sessionForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  error: string | null = null;
  sessionId: number | null = null;
  originalSession: StudySessionDto | null = null;

  private routeSubscription: Subscription | null = null;
  private saveSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: StudySessionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('sessionId');
        if (!idParam) {
          this.handleLoadError('No session ID found in route.');
          return of(null);
        }
        const parsedId = parseInt(idParam, 10);
        if (isNaN(parsedId)) {
          this.handleLoadError('Invalid session ID.');
          return of(null);
        }
        this.sessionId = parsedId;
        this.isLoading = true;
        this.error = null;
        this.cdr.markForCheck();
        return this.sessionService.getSessionById(this.sessionId);
      })
    ).subscribe({
      next: (session) => {
        if (session) {
          this.originalSession = session;
          const currentUser = this.authService.getCurrentUser();
          if (!currentUser || session.creatorId !== currentUser.id) {
            this.handleLoadError('You are not authorized to edit this session.');
            this.router.navigate(['/sessions']);
            return;
          }
          this.initializeForm(session);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.handleLoadError(err?.message || 'Failed to load session details.');
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.saveSubscription?.unsubscribe();
  }

  handleLoadError(message: string): void {
    console.error("[SessionEditComponent] Load Error:", message);
    this.error = message;
    this.isLoading = false;
    this.originalSession = null;
    this.cdr.markForCheck();
  }

  initializeForm(session: StudySessionDto): void {
    this.sessionForm = this.fb.group({
      title: [session.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [session.description || '', Validators.maxLength(1000)],
      startTime: [this.formatDateTimeForInput(session.startTime), Validators.required],
      endTime: [this.formatDateTimeForInput(session.endTime)],
      location: [session.location || '', [Validators.required, Validators.maxLength(255)]],
      courseCode: [session.courseCode || '']
    }, { validators: this.endTimeAfterStartTimeValidator });
  }

  endTimeAfterStartTimeValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (endDate <= startDate) {
          return { 'endTimeBeforeStartTime': true };
        }
      } else {
        return { 'invalidDateTimeFormat': true };
      }
    }
    return null;
  }

  private formatDateTimeForInput(dateValue: Date | undefined | null): string {
    if (!dateValue || !(dateValue instanceof Date) || isNaN(dateValue.getTime())) {
      return '';
    }
    try {
      return formatDate(dateValue, 'yyyy-MM-ddTHH:mm', 'en-US');
    } catch (e) {
      console.error("Error formatting date for input:", dateValue, e);
      return '';
    }
  }


  onSubmit(): void {
    if (!this.sessionForm) {
      this.error = 'Form not initialized.';
      this.cdr.markForCheck();
      return;
    }
    this.sessionForm.markAllAsTouched();

    if (this.sessionForm.invalid) {
      console.warn("Session edit form invalid:", this.sessionForm.errors);
      this.error = 'Please fix the errors in the form.';
      this.cdr.markForCheck();
      return;
    }
    if (!this.sessionId) {
      this.error = 'Session ID is missing, cannot save.';
      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.cdr.markForCheck();

    const formValue = this.sessionForm.value;

    const updateData: UpdateStudySessionDto = {
      title: formValue.title,
      description: formValue.description || undefined,
      startTime: formValue.startTime || undefined,
      endTime: formValue.endTime || undefined,
      location: formValue.location,
      courseCode: formValue.courseCode || undefined
    };

    this.saveSubscription = this.sessionService.updateSession(this.sessionId, updateData)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (updatedSession: StudySessionDto) => {
          console.log("Session updated:", updatedSession);
          this.router.navigate(['/sessions', this.sessionId]);
        },
        error: (err: any) => {
          console.error("Error updating session:", err);
          this.error = err?.message || 'Failed to update session.';
          this.cdr.markForCheck();
        }
      });
  }

  cancelEdit(): void {
    if (this.sessionId) {
      this.router.navigate(['/sessions', this.sessionId]);
    } else {
      this.router.navigate(['/sessions']);
    }
  }
}
