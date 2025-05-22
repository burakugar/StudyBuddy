import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MatchCardDto } from '../models/matching.models';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly API_URL = `${environment.apiUrl}/matches`;

  constructor(private http: HttpClient) {}

  /**
   * Get potential study matches for quick matching
   */
  getPotentialMatches(): Observable<MatchCardDto[]> {
    const requestUrl = `${this.API_URL}/quick`;
    console.log('Attempting to GET:', requestUrl);
    return this.http.get<MatchCardDto[]>(requestUrl).pipe(
      tap(data => console.log('Received potential matches:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Process a match action (accept or reject)
   * The backend expects 'ACCEPTED' or 'REJECTED' as the action value
   */
  private processMatchAction(userId: number, action: 'ACCEPTED' | 'REJECTED'): Observable<any> {
    const requestUrl = `${this.API_URL}/quick/${userId}`;
    console.log(`Attempting to POST to: ${requestUrl} with action: ${action}`);

    return this.http.post(requestUrl, { action }).pipe(
      tap(response => console.log(`Match action ${action} successful for user ${userId}. Response:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Like a potential study partner (Accept)
   */
  likeMatch(userId: number): Observable<any> {
    return this.processMatchAction(userId, 'ACCEPTED');
  }

  /**
   * Skip a potential study partner (Reject)
   */
  skipMatch(userId: number): Observable<any> {
    return this.processMatchAction(userId, 'REJECTED');
  }

  /**
   * Error handler for HTTP requests
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your network connection.';
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = `Error ${error.status}: ${error.error.message}`;
      } else if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          errorMessage = parsedError.message || `Error ${error.status}: ${error.statusText}`;
        } catch (e) {
          errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error(errorMessage);
    return throwError(() => ({ error: errorMessage, originalError: error }));
  }
}
