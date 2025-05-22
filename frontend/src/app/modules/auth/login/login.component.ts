import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">Study Buddy Login</h4>
            </div>
            <div class="card-body">
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div *ngIf="error" class="alert alert-danger">
                  {{ error }}
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    class="form-control"
                    [ngClass]="{'is-invalid': submitted && f['email'].errors}"
                  />
                  <div *ngIf="submitted && f['email'].errors" class="invalid-feedback">
                    <div *ngIf="f['email'].errors?.['required']">Email is required</div>
                    <div *ngIf="f['email'].errors?.['email']">Email must be valid</div>
                  </div>
                </div>

                <div class="mb-3">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <label for="password" class="form-label mb-0">Password</label>
                    <a routerLink="/auth/forgot-password" class="form-text text-muted small text-decoration-none">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    id="password"
                    formControlName="password"
                    class="form-control"
                    [ngClass]="{'is-invalid': submitted && f['password'].errors}"
                  />
                  <div *ngIf="submitted && f['password'].errors" class="invalid-feedback">
                    <div *ngIf="f['password'].errors?.['required']">Password is required</div>
                  </div>
                </div>

                <div class="d-grid gap-2">
                  <button [disabled]="loading" class="btn btn-primary">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                    Login
                  </button>
                </div>
              </form>

              <div class="mt-3 text-center">
                <p>Don't have an account? <a routerLink="/auth/register">Register</a></p>
              </div>

              <div *ngIf="debug" class="mt-3 border-top pt-3">
                <small class="text-muted">Debug Info:</small>
                <p class="mb-1"><small>Return URL: {{ returnUrl }}</small></p>
                <button (click)="testLogin()" class="btn btn-sm btn-outline-secondary mt-2">
                  Test Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl = '';
  debug = true;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    console.log('[LoginComponent] Constructor executed');

    const token = this.authService.getToken();
    console.log('[LoginComponent] Current token exists:', !!token);

    if (token) {
      this.authService.isAuthenticated$.subscribe(isAuthenticated => {
        if (isAuthenticated) {
          console.log('[LoginComponent] User already authenticated, redirecting...');
          const urlToNavigate = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(urlToNavigate);
        }
      });
    }
  }

  ngOnInit(): void {
    console.log('[LoginComponent] ngOnInit');

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    console.log('[LoginComponent] Return URL set to:', this.returnUrl);
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    console.log('[LoginComponent] Form submitted');
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      console.log('[LoginComponent] Form invalid');
      return;
    }

    this.loading = true;

    this.authService.login({
      email: this.f['email'].value,
      password: this.f['password'].value
    })
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: () => {
          console.log('[LoginComponent] Login successful, navigating to:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
        },
        error: error => {
          console.error('[LoginComponent] Login error:', error);
          this.error = error.message || 'Login failed. Please check credentials.';
        }
      });
  }

  testLogin(): void {
    this.f['email'].setValue('john.doe@university.edu');
    this.f['password'].setValue('admin');
    this.onSubmit();
  }
}
