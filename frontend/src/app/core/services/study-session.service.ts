import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StudySessionDto, CreateStudySessionDto, UpdateStudySessionDto } from '../models/study-session.models';

@Injectable({
  providedIn: 'root'
})
export class StudySessionService {
  private readonly API_URL = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) { }

  getAllPublicSessions(page: number = 0, size: number = 20): Observable<StudySessionDto[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    console.log(`[StudySessionService] Getting public sessions (page ${page}, size ${size})`);
    return this.http.get<any[]>(this.API_URL, { params })
      .pipe(
        map(sessions => sessions.map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto))),
        catchError(this.handleError)
      );
  }

  getSessionById(sessionId: number): Observable<StudySessionDto> {
    console.log(`[StudySessionService] Getting session by ID: ${sessionId}`);
    return this.http.get<any>(`${this.API_URL}/${sessionId}`)
      .pipe(
        map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto)),
        catchError(this.handleError)
      );
  }

  getMyUpcomingSessions(limit: number = 5): Observable<StudySessionDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    console.log(`[StudySessionService] Getting my upcoming sessions (limit ${limit})`);
    return this.http.get<any[]>(`${this.API_URL}/my/upcoming`, { params })
      .pipe(
        map(sessions => sessions.map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto))),
        catchError(this.handleError)
      );
  }

  getAllMySessions(): Observable<StudySessionDto[]> {
    console.log('[StudySessionService] Getting all my sessions');
    return this.http.get<any[]>(`${this.API_URL}/my/all`)
      .pipe(
        map(sessions => sessions.map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto))),
        catchError(this.handleError)
      );
  }

  joinSession(sessionId: number): Observable<StudySessionDto> {
    console.log(`[StudySessionService] Joining session ${sessionId}`);
    return this.http.post<any>(`${this.API_URL}/${sessionId}/join`, {})
      .pipe(
        map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto)),
        catchError(this.handleError)
      );
  }

  leaveSession(sessionId: number): Observable<StudySessionDto> {
    console.log(`[StudySessionService] Leaving session ${sessionId}`);
    return this.http.post<any>(`${this.API_URL}/${sessionId}/leave`, {})
      .pipe(
        map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto)),
        catchError(this.handleError)
      );
  }

  createSession(sessionData: CreateStudySessionDto): Observable<StudySessionDto> {
    console.log('[StudySessionService] Creating session:', sessionData);
    return this.http.post<any>(this.API_URL, sessionData)
      .pipe(
        map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto)),
        catchError(this.handleError));
  }

  updateSession(sessionId: number, sessionData: UpdateStudySessionDto): Observable<StudySessionDto> {
    console.log(`[StudySessionService] Updating session ${sessionId}:`, sessionData);
    return this.http.put<any>(`${this.API_URL}/${sessionId}`, sessionData)
      .pipe(
        map(s => ({
          ...s,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        } as StudySessionDto)),
        catchError(this.handleError));
  }

  deleteSession(sessionId: number): Observable<void> {
    console.log(`[StudySessionService] Deleting session ${sessionId}`);
    return this.http.delete<void>(`${this.API_URL}/${sessionId}`)
      .pipe(catchError(this.handleError));
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred in StudySessionService';
    if (error.error instanceof ErrorEvent) { errorMessage = `Client error: ${error.error.message}`; }
    else if (error.status === 0) { errorMessage = 'Unable to connect to the server. Please check your network connection.'; }
    else {
      const backendMessage = error.error?.message || error.error?.error || JSON.stringify(error.error);
      if (backendMessage) { errorMessage = `Error ${error.status}: ${backendMessage}`; }
      else { errorMessage = `Server returned code ${error.status}, error message: ${error.message}`; }
    }
    console.error(`[StudySessionService] HTTP error: ${errorMessage}`, error);
    return throwError(() => ({ message: errorMessage, status: error.status, originalError: error }));
  }
}
