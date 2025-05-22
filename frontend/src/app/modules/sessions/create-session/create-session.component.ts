import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CreateStudySessionDto } from '../../../core/models/study-session.models';
import { StudySessionService } from '../../../core/services/study-session.service';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './create-session.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateSessionComponent implements OnInit, OnDestroy {
  sessionForm!: FormGroup;
  isSubmitting: boolean = false;
  error: string | null = null;
  success: boolean = false;

  private createSessionSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private sessionService: StudySessionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.sessionForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      startTime: ['', Validators.required],
      endTime: [''],
      location: ['', [Validators.required, Validators.maxLength(255)]],
      courseCode: ['']
    });
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.success = false;
    this.cdr.markForCheck();

    const formValue = this.sessionForm.value;
    let startTimeISO: string | undefined = undefined;
    let endTimeISO: string | undefined = undefined;

    try {
      if (formValue.startTime) {
        const startDate = new Date(formValue.startTime);
        startTimeISO = startDate.toISOString();
      }

      if (formValue.endTime) {
        const endDate = new Date(formValue.endTime);
        if (startTimeISO && endDate <= new Date(startTimeISO)) {
          this.error = 'End time must be after start time.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
          return;
        }
        endTimeISO = endDate.toISOString();
      }
    } catch (e) {
      console.error("Error parsing date/time:", e);
      this.error = 'Invalid date/time format entered.';
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }

    const sessionData: CreateStudySessionDto = {
      title: formValue.title,
      description: formValue.description || undefined,
      startTime: startTimeISO!,
      endTime: endTimeISO,
      location: formValue.location,
      courseCode: formValue.courseCode || undefined
    };

    this.createSessionSubscription = this.sessionService.createSession(sessionData)
      .subscribe({
        next: (createdSession) => {
          console.log("Session created:", createdSession);
          this.success = true;
          this.isSubmitting = false;
          this.sessionForm.reset();

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error creating session:', err);
          this.error = err?.message || 'Failed to create session. Please check the details and try again.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.createSessionSubscription?.unsubscribe();
  }
}
