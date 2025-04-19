import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CourseDto {
  courseCode: string;
  name: string;
}

export interface InterestDto {
  name: string;
}

export interface UserProfileDto {
  id: number;
  email: string;
  fullName: string;
  academicYear?: string;
  profilePictureUrl?: string;
  major?: string;
  university?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
  courses: CourseDto[];
  interests: InterestDto[];
}

export interface UserUpdateDto {
  fullName?: string;
  academicYear?: string;
  major?: string;
  university?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
  profilePictureUrl?: string;
  courseCodes?: string[];
  interestNames?: string[];
}

export interface PublicProfileDto {
  id: number;
  fullName: string;
  academicYear?: string;
  major?: string;
  university?: string;
  profilePictureUrl?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  /**
   * Get the current user's profile
   */
  getMyProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.API_URL}/me`);
  }

  /**
   * Update the current user's profile
   */
  updateMyProfile(userUpdateDto: UserUpdateDto): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.API_URL}/me`, userUpdateDto);
  }

  /**
   * Get public profile information for a specific user
   */
  getPublicProfile(userId: number): Observable<PublicProfileDto> {
    return this.http.get<PublicProfileDto>(`${this.API_URL}/${userId}/public`);
  }
}
