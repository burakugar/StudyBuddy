import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, finalize, merge, Observable, Subscription } from 'rxjs';
import { AvailabilitySlotDto, DayOfWeek } from '../../../core/models/availability.model';
import { UserProfileDto, UserUpdateDto } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile-view-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-view-edit.component.html',
  styleUrls: ['./profile-view-edit.component.scss']
})
export class ProfileViewEditComponent implements OnInit, OnDestroy {
  profile: UserProfileDto | null = null;
  profileForm!: FormGroup;
  loading = false;
  saving = false;
  editMode = false;
  submitted = false;
  error = '';
  locationSet = false;

  daysOfWeek: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  private profileSubscription: Subscription | null = null;
  private formChangesSubscription: Subscription | null = null;


  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.profileSubscription?.unsubscribe();
    this.formChangesSubscription?.unsubscribe();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.profileSubscription = this.userService.getMyProfile()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.locationSet = !!(profile.latitude && profile.longitude);
          this.initializeForm();
        },
        error: (err) => {
          console.error("Error loading profile:", err);
          this.error = err?.message || 'Failed to load profile. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  initializeForm(): void {
    if (!this.profile) return;

    const coursesString = this.profile.courses?.map(course => course.courseCode).join(', ') || '';
    const interestsString = this.profile.interests?.map(interest => interest.name).join(', ') || '';

    this.profileForm = this.formBuilder.group({
      fullName: [this.profile.fullName || '', Validators.required],
      academicYear: [this.profile.academicYear || ''],
      major: [this.profile.major || ''],
      university: [this.profile.university || ''],
      bio: [this.profile.bio || ''],
      studyStyle: [this.profile.studyStyle || ''],
      preferredEnvironment: [this.profile.preferredEnvironment || ''],
      profilePictureUrl: [this.profile.profilePictureUrl || ''],
      courses: [coursesString],
      interests: [interestsString],
      latitude: [this.profile.latitude ?? ''],
      longitude: [this.profile.longitude ?? ''],
      availabilitySlots: this.formBuilder.array(
        this.profile.availabilitySlots?.map(slot => this.createAvailabilitySlotGroup(slot)) || []
      )
    });

    this.formChangesSubscription?.unsubscribe();

    const latControl = this.profileForm.get('latitude');
    const lonControl = this.profileForm.get('longitude');

    const latChanges$: Observable<any> = latControl?.valueChanges ?? EMPTY;
    const lonChanges$: Observable<any> = lonControl?.valueChanges ?? EMPTY;

    this.formChangesSubscription = merge(latChanges$, lonChanges$)
      .subscribe(() => {
        this.checkLocationSet();
        this.cdr.markForCheck();
      });

    this.cdr.markForCheck();
  }

  createAvailabilitySlotGroup(slot?: AvailabilitySlotDto): FormGroup {
    return this.formBuilder.group({
      id: [slot?.id],
      dayOfWeek: [slot?.dayOfWeek || '', Validators.required],
      startTime: [slot?.startTime || '', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      endTime: [slot?.endTime || '', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]]
    }, { validators: this.timeSlotValidator });
  }

  timeSlotValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    if (start && end && start >= end) {
      return { 'endTimeBeforeStartTime': true };
    }
    return null;
  }


  get availabilitySlotsArray(): FormArray {
    return this.profileForm.get('availabilitySlots') as FormArray;
  }

  addAvailabilitySlot(): void {
    this.availabilitySlotsArray.push(this.createAvailabilitySlotGroup());
    this.cdr.markForCheck();
  }

  removeAvailabilitySlot(index: number): void {
    this.availabilitySlotsArray.removeAt(index);
    this.cdr.markForCheck();
  }


  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.error = '';
    if (this.editMode && !this.profileForm) {
      this.initializeForm();
    } else if (!this.editMode && this.profileForm?.dirty) {
      this.initializeForm();
    }
    this.submitted = false;
    this.cdr.markForCheck();
  }

  get f() { return this.profileForm.controls; }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.error = 'Geolocation is not supported by your browser.';
      this.cdr.markForCheck();
      return;
    }
    this.error = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.f['latitude'].setValue(position.coords.latitude.toFixed(6));
        this.f['longitude'].setValue(position.coords.longitude.toFixed(6));
      },
      (geoError) => {
        console.error('Error getting location:', geoError);
        this.error = `Could not get location: ${geoError.message}`;
        this.cdr.markForCheck();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  clearLocation(): void {
    this.f['latitude'].setValue('');
    this.f['longitude'].setValue('');
  }

  checkLocationSet(): void {
    const lat = this.f['latitude']?.value;
    const lon = this.f['longitude']?.value;
    const newStatus = (lat !== null && lat !== '' && lon !== null && lon !== '');
    if (this.locationSet !== newStatus) {
      this.locationSet = newStatus;
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.profileForm.markAllAsTouched();
    this.cdr.markForCheck();

    if (this.profileForm.invalid) {
      console.warn("Profile form invalid:", this.profileForm.errors);
      for (const key of Object.keys(this.profileForm.controls)) {
        if (this.profileForm.controls[key].invalid) {
          console.log(`Invalid control: ${key}`, this.profileForm.controls[key].errors);
          if (key === 'availabilitySlots' && this.profileForm.controls[key] instanceof FormArray) {
            (this.profileForm.controls[key] as FormArray).controls.forEach((group, index) => {
              if (group.invalid) {
                console.log(`Invalid availability slot at index ${index}:`, group.errors, group.value);
              }
            });
          }
        }
      }
      this.error = 'Please fix the errors in the form before saving.';
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const formValue = this.profileForm.value;

    const courseCodes = formValue.courses
      ? formValue.courses.split(',').map((code: string) => code.trim()).filter(Boolean)
      : [];

    const interestNames = formValue.interests
      ? formValue.interests.split(',').map((interest: string) => interest.trim()).filter(Boolean)
      : [];

    const latitude = (formValue.latitude !== null && formValue.latitude !== '') ? parseFloat(formValue.latitude) : null;
    const longitude = (formValue.longitude !== null && formValue.longitude !== '') ? parseFloat(formValue.longitude) : null;

    const validAvailabilitySlots = formValue.availabilitySlots
      .filter((slot: AvailabilitySlotDto) =>
        slot.dayOfWeek && slot.startTime && slot.endTime && slot.startTime < slot.endTime
      )
      .map((slot: AvailabilitySlotDto) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime
      }));


    const updateData: UserUpdateDto = {
      fullName: formValue.fullName,
      academicYear: formValue.academicYear || null,
      major: formValue.major || null,
      university: formValue.university || null,
      bio: formValue.bio || null,
      studyStyle: formValue.studyStyle || null,
      preferredEnvironment: formValue.preferredEnvironment || null,
      profilePictureUrl: formValue.profilePictureUrl || null,
      latitude: latitude,
      longitude: longitude,
      courseCodes: courseCodes,
      interestNames: interestNames,
      availabilitySlots: validAvailabilitySlots
    };

    this.userService.updateMyProfile(updateData)
      .pipe(finalize(() => {
        this.saving = false;
        this.submitted = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (updatedProfile) => {
          this.profile = updatedProfile;
          this.locationSet = !!(updatedProfile.latitude && updatedProfile.longitude);
          this.editMode = false;
          this.initializeForm();
        },
        error: (err) => {
          console.error("Error updating profile:", err);
          this.error = err?.message || 'Failed to update profile. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }
}
