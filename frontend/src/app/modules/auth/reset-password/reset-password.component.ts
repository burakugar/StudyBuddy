import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service'; // Adjust path if needed
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Custom validator for password match
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  if (password?.pristine || confirmPassword?.pristine) {
    return null;
  }
  return password && confirmPassword && password.value !== confirmPassword.value ? { 'passwordMismatch': true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm!: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  token: string | null = null;
  tokenChecked = false; 
  isTokenValid = false; 

  private routeSub: Subscription | null = null;
  private validationSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.errorMessage = "Invalid or missing password reset token.";
        this.tokenChecked = true;
        this.isTokenValid = false;
        this.cdr.markForCheck();
      } else {
        // Optional: Validate token immediately on load
        // this.validateToken(this.token);
        this.tokenChecked = true; // Assume valid until submit if not validating here
        this.isTokenValid = true; // Assume valid until submit
        this.cdr.markForCheck();
      }
    });

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.validationSub?.unsubscribe();
  }

  get f() { return this.resetPasswordForm.controls; }

 

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.resetPasswordForm.invalid || !this.token) {
        if (!this.token) this.errorMessage = "Password reset token is missing.";
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.authService.resetPassword(this.token, this.f['newPassword'].value)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.successMessage = "Password reset successfully. You can now log in with your new password.";
          this.resetPasswordForm.reset();
          this.submitted = false; // Reset submitted flag
           // Optional: Redirect to login after a delay
           setTimeout(() => this.router.navigate(['/auth/login']), 3000);
        },
        error: (err) => {
          console.error('Reset password error:', err);
          this.errorMessage = err?.message || 'Failed to reset password. The token may be invalid or expired.';
          this.isTokenValid = false; // Mark token as potentially invalid on error
        }
      });
  }
}
