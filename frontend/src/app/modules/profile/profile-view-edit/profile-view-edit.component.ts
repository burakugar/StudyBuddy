import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfileDto, UserService, UserUpdateDto } from '../../../core/services/user.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile-view-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-8 mx-auto">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h4 class="mb-0">{{ editMode ? 'Edit Profile' : 'My Profile' }}</h4>
              <button *ngIf="!editMode" (click)="toggleEditMode()" class="btn btn-primary btn-sm">
                Edit Profile
              </button>
            </div>

            <div class="card-body">
              <!-- Loading spinner -->
              <div *ngIf="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <!-- Error message -->
              <div *ngIf="error" class="alert alert-danger">
                {{ error }}
              </div>

              <!-- View mode -->
              <div *ngIf="!editMode && profile && !loading">
                <div class="row mb-4">
                  <div class="col-md-4 text-center mb-3 mb-md-0">
                    <img [src]="profile.profilePictureUrl || 'https://placehold.co/200x200?text=Profile'"
                         alt="{{ profile.fullName }}"
                         class="img-fluid rounded-circle"
                         style="max-width: 150px;">
                  </div>
                  <div class="col-md-8">
                    <h3>{{ profile.fullName }}</h3>
                    <p class="text-muted mb-1">{{ profile.academicYear || 'No academic year specified' }}</p>
                    <p><strong>Major:</strong> {{ profile.major || 'Not specified' }}</p>
                    <p><strong>University:</strong> {{ profile.university || 'Not specified' }}</p>
                  </div>
                </div>

                <hr>

                <div class="mb-4">
                  <h5>About Me</h5>
                  <p>{{ profile.bio || 'No bio provided' }}</p>
                </div>

                <div class="row mb-4">
                  <div class="col-md-6">
                    <h5>Study Preferences</h5>
                    <p><strong>Study Style:</strong> {{ profile.studyStyle || 'Not specified' }}</p>
                    <p><strong>Preferred Environment:</strong> {{ profile.preferredEnvironment || 'Not specified' }}</p>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-4">
                    <h5>My Courses</h5>
                    <div *ngIf="profile.courses && profile.courses.length > 0; else noCourses">
                      <div class="d-flex flex-wrap gap-2">
                        <span *ngFor="let course of profile.courses" class="badge bg-primary">
                          {{ course.courseCode }}
                        </span>
                      </div>
                    </div>
                    <ng-template #noCourses>
                      <p class="text-muted">No courses added</p>
                    </ng-template>
                  </div>

                  <div class="col-md-6 mb-4">
                    <h5>My Interests</h5>
                    <div *ngIf="profile.interests && profile.interests.length > 0; else noInterests">
                      <div class="d-flex flex-wrap gap-2">
                        <span *ngFor="let interest of profile.interests" class="badge bg-secondary">
                          {{ interest.name }}
                        </span>
                      </div>
                    </div>
                    <ng-template #noInterests>
                      <p class="text-muted">No interests added</p>
                    </ng-template>
                  </div>
                </div>
              </div>

              <!-- Edit mode -->
              <form *ngIf="editMode && profile && !loading" [formGroup]="profileForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="fullName" class="form-label">Full Name *</label>
                  <input type="text" id="fullName" formControlName="fullName" class="form-control"
                         [ngClass]="{'is-invalid': submitted && f['fullName'].errors}"/>
                  <div *ngIf="submitted && f['fullName'].errors" class="invalid-feedback">
                    <div *ngIf="f['fullName'].errors?.['required']">Full name is required</div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="academicYear" class="form-label">Academic Year</label>
                    <select id="academicYear" formControlName="academicYear" class="form-select">
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
                    <input type="text" id="major" formControlName="major" class="form-control"/>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="university" class="form-label">University</label>
                  <input type="text" id="university" formControlName="university" class="form-control"/>
                </div>

                <div class="mb-3">
                  <label for="bio" class="form-label">Bio</label>
                  <textarea id="bio" formControlName="bio" class="form-control" rows="3"></textarea>
                </div>

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
                  <label for="courses" class="form-label">Current Courses</label>
                  <input type="text" id="courses" formControlName="courses" class="form-control"
                         placeholder="Enter comma-separated course codes (e.g., CS101, MATH101)"/>
                  <div class="form-text">Enter comma-separated course codes</div>
                </div>

                <div class="mb-3">
                  <label for="interests" class="form-label">Study Interests</label>
                  <input type="text" id="interests" formControlName="interests" class="form-control"
                         placeholder="Enter comma-separated interests (e.g., Programming, Calculus)"/>
                  <div class="form-text">Enter comma-separated interests</div>
                </div>

                <div class="mb-3">
                  <label for="profilePictureUrl" class="form-label">Profile Picture URL</label>
                  <input type="text" id="profilePictureUrl" formControlName="profilePictureUrl" class="form-control"
                         placeholder="https://example.com/your-image.jpg"/>
                  <div class="form-text">Enter URL to your profile picture</div>
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="saving">
                    <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                    Save Changes
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="toggleEditMode()">
                    Cancel
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileViewEditComponent implements OnInit {
  profile: UserProfileDto | null = null;
  profileForm!: FormGroup;
  loading = false;
  saving = false;
  editMode = false;
  submitted = false;
  error = '';

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.initializeForm();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load profile. Please try again.';
        this.loading = false;
      }
    });
  }

  initializeForm(): void {
    if (this.profile) {
      // Format courses and interests for form
      const coursesString = this.profile.courses?.map(course => course.courseCode).join(', ') || '';
      const interestsString = this.profile.interests?.map(interest => interest.name).join(', ') || '';

      this.profileForm = this.formBuilder.group({
        fullName: [this.profile.fullName, Validators.required],
        academicYear: [this.profile.academicYear || ''],
        major: [this.profile.major || ''],
        university: [this.profile.university || ''],
        bio: [this.profile.bio || ''],
        studyStyle: [this.profile.studyStyle || ''],
        preferredEnvironment: [this.profile.preferredEnvironment || ''],
        profilePictureUrl: [this.profile.profilePictureUrl || ''],
        courses: [coursesString],
        interests: [interestsString]
      });
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.submitted = false;
      this.initializeForm(); // Reset form when canceling edit
    }
  }

  // Getter for form controls
  get f() { return this.profileForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    // Stop if form is invalid
    if (this.profileForm.invalid) {
      return;
    }

    this.saving = true;
    this.error = '';

    // Parse comma-separated values
    const courseCodes = this.f['courses'].value
      ? this.f['courses'].value.split(',').map((code: string) => code.trim()).filter((code: string) => code)
      : [];

    const interestNames = this.f['interests'].value
      ? this.f['interests'].value.split(',').map((interest: string) => interest.trim()).filter((interest: string) => interest)
      : [];

    const updateData: UserUpdateDto = {
      fullName: this.f['fullName'].value,
      academicYear: this.f['academicYear'].value,
      major: this.f['major'].value,
      university: this.f['university'].value,
      bio: this.f['bio'].value,
      studyStyle: this.f['studyStyle'].value,
      preferredEnvironment: this.f['preferredEnvironment'].value,
      profilePictureUrl: this.f['profilePictureUrl'].value,
      courseCodes: courseCodes,
      interestNames: interestNames
    };

    this.userService.updateMyProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.saving = false;
        this.editMode = false;
        this.submitted = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update profile. Please try again.';
        this.saving = false;
      }
    });
  }
}
