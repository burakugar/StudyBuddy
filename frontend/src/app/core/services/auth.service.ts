import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

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

interface User {
  id: number;
  email: string;
  fullName: string;
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

    // Initialize the state only if we're in a browser
    if (this.isBrowser) {
      this.isAuthenticatedSubject.next(this.hasToken());
      this.currentUserSubject.next(this.getSavedUser());
    }
  }

  /**
   * Register a new user
   */
  register(signupRequest: SignupRequest): Observable<any> {
    return this.http.post<JwtResponse>(`${this.API_URL}/signup`, signupRequest)
      .pipe(
        tap(response => this.handleAuthentication(response))
      );
  }

  /**
   * Login a user
   */
  login(loginRequest: LoginRequest): Observable<any> {
    return this.http.post<JwtResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => this.handleAuthentication(response))
      );
  }

  /**
   * Logout the current user
   */
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }

    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  /**
   * Check if the user is authenticated
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Get the saved user from local storage
   */
  private getSavedUser(): User | null {
    if (!this.isBrowser) {
      return null;
    }

    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Handle authentication response
   */
  private handleAuthentication(response: JwtResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, response.token);

      const user: User = {
        id: response.id,
        email: response.email,
        fullName: response.fullName
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Always update the subjects
    const user: User = {
      id: response.id,
      email: response.email,
      fullName: response.fullName
    };

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }
}
