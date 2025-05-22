import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NearbyUserDto,
  PublicProfileDto,
  UserProfileDto,
  UserUpdateDto
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getMyProfile(): Observable<UserProfileDto> {
    console.log('[UserService] Fetching my profile');
    return this.http.get<UserProfileDto>(`${this.API_URL}/me`)
      .pipe(catchError(this.handleError));
  }

  updateMyProfile(userUpdateDto: UserUpdateDto): Observable<UserProfileDto> {
    console.log('[UserService] Updating profile with data:', userUpdateDto);
    return this.http.put<UserProfileDto>(`${this.API_URL}/me`, userUpdateDto)
      .pipe(catchError(this.handleError));
  }

  getPublicProfile(userId: number): Observable<PublicProfileDto> {
    console.log(`[UserService] Fetching public profile for user ${userId}`);
    return this.http.get<PublicProfileDto>(`${this.API_URL}/${userId}/public`)
      .pipe(catchError(this.handleError));
  }

  getNearbyUsers(radiusKm: number = 5, limit: number = 20): Observable<NearbyUserDto[]> {
    const params = new HttpParams()
      .set('radiusKm', radiusKm.toString())
      .set('limit', limit.toString());
    console.log(`[UserService] Requesting nearby users with radius=${radiusKm}km, limit=${limit}`);
    return this.http.get<NearbyUserDto[]>(`${this.API_URL}/nearby`, { params })
      .pipe(
        map(users => users.map(user => ({
          ...user,
          profilePictureUrl: user.profilePictureUrl || environment.defaultAvatarUrl
        }))),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your network connection.';
    } else {
      const backendMessage = error.error?.message || error.error?.error;
      if (backendMessage) {
        errorMessage = `Error ${error.status}: ${backendMessage}`;
      } else {
        errorMessage = `Server returned code ${error.status}, error message: ${error.message}`;
      }
    }
    console.error(`[UserService] HTTP error: ${errorMessage}`, error);
    return throwError(() => ({ message: errorMessage, status: error.status, originalError: error }));
  }
}
