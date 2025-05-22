import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  academicYear?: string;
  major?: string;
  university?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
  courseCodes?: string[];
  interestNames?: string[];
  profilePictureUrl?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">Create Your Study Buddy Account</h4>
            </div>
            <div class="card-body">
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <div *ngIf="error" class="alert alert-danger">
                  {{ error }}
                </div>

                <h5 class="mb-3">Account Information</h5>

                <div class="mb-3">
                  <label for="email" class="form-label">Email *</label>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    class="form-control"
                    [ngClass]="{'is-invalid': submitted && f['email'].errors}"
                  />
                  <div *ngIf="submitted && f['email'].errors" class="invalid-feedback">
                    <div *ngIf="f['email'].errors['required']">Email is required</div>
                    <div *ngIf="f['email'].errors['email']">Email must be valid</div>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password *</label>
                  <input
                    type="password"
                    id="password"
                    formControlName="password"
                    class="form-control"
                    [ngClass]="{'is-invalid': submitted && f['password'].errors}"
                  />
                  <div *ngIf="submitted && f['password'].errors" class="invalid-feedback">
                    <div *ngIf="f['password'].errors['required']">Password is required</div>
                    <div *ngIf="f['password'].errors['minlength']">Password must be at least 6 characters</div>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="fullName" class="form-label">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    formControlName="fullName"
                    class="form-control"
                    [ngClass]="{'is-invalid': submitted && f['fullName'].errors}"
                  />
                  <div *ngIf="submitted && f['fullName'].errors" class="invalid-feedback">
                    <div *ngIf="f['fullName'].errors['required']">Full name is required</div>
                  </div>
                </div>

                <hr class="my-4">

                <h5 class="mb-3">Academic Information</h5>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="academicYear" class="form-label">Academic Year</label>
                    <select
                      id="academicYear"
                      formControlName="academicYear"
                      class="form-select"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="major" class="form-label">Major</label>
                    <input type="text" id="major" formControlName="major" class="form-control">
                  </div>
                </div>

                <div class="mb-3">
                  <label for="university" class="form-label">University</label>
                  <input type="text" id="university" formControlName="university" class="form-control">
                </div>

                <div class="mb-3">
                  <label for="courses" class="form-label">Current Courses</label>
                  <input
                    type="text"
                    id="courses"
                    formControlName="courses"
                    class="form-control"
                    placeholder="Enter comma-separated course codes (e.g., CS101, MATH101)"
                  >
                  <div class="form-text">Enter comma-separated course codes</div>
                </div>

                <div class="mb-3">
                  <label for="interests" class="form-label">Study Interests</label>
                  <input
                    type="text"
                    id="interests"
                    formControlName="interests"
                    class="form-control"
                    placeholder="Enter comma-separated interests (e.g., Programming, Calculus)"
                  >
                  <div class="form-text">Enter comma-separated interests</div>
                </div>

                <hr class="my-4">

                <h5 class="mb-3">Study Preferences</h5>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="studyStyle" class="form-label">Study Style</label>
                    <select id="studyStyle" formControlName="studyStyle" class="form-select">
                      <option value="">Select Style</option>
                      <option value="Quiet">Quiet</option>
                      <option value="Collaborative">Collaborative</option>
                      <option value="Discussion-based">Discussion-based</option>
                      <option value="Visual">Visual</option>
                    </select>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="preferredEnvironment" class="form-label">Preferred Environment</label>
                    <select id="preferredEnvironment" formControlName="preferredEnvironment" class="form-select">
                      <option value="">Select Environment</option>
                      <option value="Library">Library</option>
                      <option value="Cafe">Cafe</option>
                      <option value="Online">Online</option>
                      <option value="Outdoors">Outdoors</option>
                      <option value="Classroom">Classroom</option>
                    </select>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="bio" class="form-label">Bio</label>
                  <textarea
                    id="bio"
                    formControlName="bio"
                    class="form-control"
                    rows="3"
                    placeholder="Tell potential study buddies a bit about yourself..."
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label for="profilePictureUrl" class="form-label">Profile Picture URL</label>
                  <input
                    type="text"
                    id="profilePictureUrl"
                    formControlName="profilePictureUrl"
                    class="form-control"
                    placeholder="https://example.com/your-image.jpg"
                  >
                  <div class="form-text">Enter URL to your profile picture (optional)</div>
                </div>

                <div class="d-grid gap-2 mt-4">
                  <button [disabled]="loading" type="submit" class="btn btn-primary">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                    Create Account
                  </button>
                </div>
              </form>

              <div class="mt-3 text-center">
                <p>Already have an account? <a routerLink="/auth/login">Login</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.getCurrentUser()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', Validators.required],
      academicYear: [''],
      major: [''],
      university: [''],
      courses: [''],
      interests: [''],
      studyStyle: [''],
      preferredEnvironment: [''],
      bio: [''],
      profilePictureUrl: ['']
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const courseCodes = this.f['courses'].value
      ? this.f['courses'].value.split(',').map((code: string) => code.trim()).filter((code: string) => code)
      : [];

    const interestNames = this.f['interests'].value
      ? this.f['interests'].value.split(',').map((interest: string) => interest.trim()).filter((interest: string) => interest)
      : [];

    const signupRequest: SignupRequest = {
      email: this.f['email'].value,
      password: this.f['password'].value,
      fullName: this.f['fullName'].value,
      academicYear: this.f['academicYear'].value || undefined,
      major: this.f['major'].value || undefined,
      university: this.f['university'].value || undefined,
      bio: this.f['bio'].value || undefined,
      studyStyle: this.f['studyStyle'].value || undefined,
      preferredEnvironment: this.f['preferredEnvironment'].value || undefined,
      courseCodes: courseCodes,
      interestNames: interestNames,
      profilePictureUrl: this.f['profilePictureUrl'].value || undefined
    };

    this.authService.register(signupRequest).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: error => {
        this.error = error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
