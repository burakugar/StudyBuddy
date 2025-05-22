import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/user.model';

interface LoginRequest {
email: string;
password: string;
}

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

interface JwtResponse {
token: string;
id: number;
email: string;
fullName: string;
}

interface ForgotPasswordRequest {
email: string;
}

interface ResetPasswordRequest {
token: string;
newPassword: string;
}

@Injectable({
providedIn: 'root'
})
export class AuthService {
private readonly TOKEN_KEY = 'auth_token';
private readonly USER_KEY = 'current_user';
private readonly API_URL = `${environment.apiUrl}/auth`;

private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
private currentUserSubject = new BehaviorSubject<User | null>(null);
private isBrowser: boolean;

public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
public currentUser$ = this.currentUserSubject.asObservable();

constructor(
  private http: HttpClient,
  private router: Router,
  @Inject(PLATFORM_ID) platformId: Object
) {
  this.isBrowser = isPlatformBrowser(platformId);
  console.log('[AuthService] Constructor called. isBrowser:', this.isBrowser);

  if (this.isBrowser) {
    const hasToken = this.hasToken();
    const savedUser = this.getSavedUser();

    console.log('[AuthService] Initializing auth state. hasToken:', hasToken);
    console.log('[AuthService] Saved user:', savedUser ? JSON.stringify(savedUser) : 'none');

    this.isAuthenticatedSubject.next(hasToken);
    this.currentUserSubject.next(savedUser);
  }
}

register(signupRequest: SignupRequest): Observable<any> {
  console.log('[AuthService] Registering user:', signupRequest.email);
  return this.http.post<JwtResponse>(`${this.API_URL}/signup`, signupRequest)
    .pipe(
      tap(response => {
        console.log('[AuthService] Registration successful');
        this.handleAuthentication(response);
      }),
      catchError(error => {
        console.error('[AuthService] Registration failed:', error);
        return this.handleError(error);
      })
    );
}

login(loginRequest: LoginRequest): Observable<any> {
  console.log('[AuthService] Logging in user:', loginRequest.email);
  return this.http.post<JwtResponse>(`${this.API_URL}/login`, loginRequest)
    .pipe(
      tap(response => {
        console.log('[AuthService] Login successful');
        this.handleAuthentication(response);
      }),
      catchError(error => {
        console.error('[AuthService] Login failed:', error);
        return this.handleError(error);
      })
    );
}

logout(): void {
  console.log('[AuthService] Logging out user');
  if (this.isBrowser) {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  this.isAuthenticatedSubject.next(false);
  this.currentUserSubject.next(null);
  Promise.resolve().then(() => this.router.navigate(['/auth/login']));
}

getToken(): string | null {
  const token = this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
  return token;
}

checkToken(): Observable<boolean> {
  const token = this.getToken();
  const hasToken = !!token;

  if (this.isAuthenticatedSubject.value !== hasToken) {
    this.isAuthenticatedSubject.next(hasToken);
  }
  if (hasToken && !this.currentUserSubject.value) {
    const user = this.getSavedUser();
    if(user) this.currentUserSubject.next(user);
  } else if (!hasToken && this.currentUserSubject.value) {
    this.currentUserSubject.next(null);
  }

  return of(hasToken);
}

getCurrentUser(): User | null {
  return this.currentUserSubject.value;
}

private hasToken(): boolean {
  const token = this.getToken();
  return !!token;
}

private getSavedUser(): User | null {
  if (!this.isBrowser) {
    return null;
  }
  const userJson = localStorage.getItem(this.USER_KEY);
  try {
    return userJson ? JSON.parse(userJson) as User : null;
  } catch (e) {
    console.error("[AuthService] Error parsing saved user from localStorage", e);
    localStorage.removeItem(this.USER_KEY);
    return null;
  }
}

private handleAuthentication(response: JwtResponse): void {
  console.log('[AuthService] Handling authentication response');

  const user: User = {
    id: response.id,
    email: response.email,
    fullName: response.fullName
  };

  if (this.isBrowser) {
    console.log('[AuthService] Saving token and user to localStorage');
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  } else {
    console.log('[AuthService] Not in browser environment, skipping localStorage');
  }

  this.currentUserSubject.next(user);
  this.isAuthenticatedSubject.next(true);
  console.log('[AuthService] Authentication state updated. isAuthenticated:', true);
}

requestPasswordReset(email: string): Observable<any> {
  console.log('[AuthService] Requesting password reset for:', email);
  const request: ForgotPasswordRequest = { email };
  return this.http.post(`${this.API_URL}/forgot-password`, request, { responseType: 'text' })
    .pipe(
      tap(response => console.log('[AuthService] Password reset request sent:', response)),
      catchError(error => {
        console.error('[AuthService] Forgot password request failed:', error);
        return this.handleError(error);
      })
    );
}

resetPassword(token: string, newPassword: string): Observable<any> {
  console.log('[AuthService] Resetting password with token:', token ? 'present' : 'missing');
  if (!token) {
    return throwError(() => new Error("Reset token is missing"));
  }
  const request: ResetPasswordRequest = { token, newPassword };
  return this.http.post(`${this.API_URL}/reset-password`, request, { responseType: 'text' })
    .pipe(
      tap(response => console.log('[AuthService] Password reset successful:', response)),
      catchError(error => {
        console.error('[AuthService] Reset password failed:', error);
        return this.handleError(error);
      })
    );
}

private handleError(error: any): Observable<never> {
  let errorMessage = 'An unknown error occurred';
  if (error.error instanceof ErrorEvent) {
    errorMessage = `Client error: ${error.error.message}`;
  } else if (error.status === 0) {
    errorMessage = 'Unable to connect to the server. Please check your network connection.';
  } else {
    const backendMessage = error.error?.message || error.error?.error || (typeof error.error === 'string' ? error.error : null) || error.message;
    errorMessage = `Error ${error.status}: ${backendMessage || error.statusText}`;
  }
  return throwError(() => new Error(errorMessage));
}
}