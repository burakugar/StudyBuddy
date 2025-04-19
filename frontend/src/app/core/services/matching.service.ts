import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Ensure HttpResponse is removed if previously added
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatchCardDto } from '../models/matching.models'; // Ensure this path is correct

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  // Use the PLURAL form to match the backend controller's @RequestMapping
  private readonly API_URL = `${environment.apiUrl}/matches`;

  constructor(private http: HttpClient) {}

  /**
   * Get potential study matches based on user preferences
   * NOTE: Ensure '/recommendations' endpoint exists in your backend if you use this.
   */
  getMatches(): Observable<MatchCardDto[]> {
    // Assuming the backend path is /api/matches/recommendations
    return this.http.get<MatchCardDto[]>(`${this.API_URL}/recommendations`);
  }

  /**
   * Get potential study matches for quick matching
   */
  getPotentialMatches(): Observable<MatchCardDto[]> {
    const requestUrl = `${this.API_URL}/quick`; // Constructs "/api/matches/quick"
    console.log('Attempting to GET:', requestUrl);
    return this.http.get<MatchCardDto[]>(requestUrl);
  }

  /**
   * Process a match action (accept or reject)
   * Reverted return type to Observable<any> (or Object)
   * Removed HttpClient options object { observe: ..., responseType: ... }
   * FIX: Changed action strings to ACCEPTED and REJECTED to match backend enum
   */
  private processMatchAction(userId: number, action: 'ACCEPTED' | 'REJECTED'): Observable<any> { // Or Observable<Object>
    const requestUrl = `${this.API_URL}/quick/${userId}`; // Constructs "/api/matches/quick/{userId}"
    console.log(`Attempting to POST to: ${requestUrl} with action: ${action}`);
    // Use default HttpClient behavior (expects JSON, gets the body)
    return this.http.post(requestUrl, { action });
  }

  /**
   * Like a potential study partner
   */
  likeMatch(userId: number): Observable<any> {
    // FIX: Ensure it sends 'ACCEPTED'
    return this.processMatchAction(userId, 'ACCEPTED');
  }

  /**
   * Skip a potential study partner
   */
  skipMatch(userId: number): Observable<any> {
    // FIX: Ensure it sends 'REJECTED'
    return this.processMatchAction(userId, 'REJECTED');
  }
}
