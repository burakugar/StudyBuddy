import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service'; 
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() { return this.forgotPasswordForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.authService.requestPasswordReset(this.f['email'].value)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.submitted = false; 
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.successMessage = "If an account exists for this email, a password reset link has been sent.";
          this.forgotPasswordForm.reset();
        },
        error: (err) => {
          console.error('Forgot password error:', err);
          this.errorMessage = err?.message || 'An unexpected error occurred. Please try again.';
        }
      });
  }
}
