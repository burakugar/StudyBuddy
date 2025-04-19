// frontend/src/app/modules/matching/quick-match/quick-match.component.ts
import { Component, OnInit } from '@angular/core';
import { MatchService } from '../../../core/services/matching.service';
import { MatchCardDto } from '../../../core/models/matching.models'; // Ensure path is correct
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {Observable} from 'rxjs'; // Keep HttpErrorResponse

// Interface definitions are usually in separate model files, but kept here for completeness if needed
// interface CourseDto { courseCode: string; name: string; }
// interface InterestDto { name: string; }

@Component({
  selector: 'app-quick-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-match.component.html',
  // Added back the styles for completeness
  styles: [`
    .match-card {
      transition: all 0.3s ease;
    }

    .match-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

    .profile-pic {
      width: 100px;
      height: 100px;
      object-fit: cover;
    }

    .bio-text {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: calc(1.5em * 3); /* Approximate height for 3 lines */
    }

    .accept-btn:hover {
      /* Consider slightly different hover effects */
      opacity: 0.8;
      transform: scale(1.05);
    }

    .reject-btn:hover {
      /* Consider slightly different hover effects */
      opacity: 0.8;
      transform: scale(1.05);
    }
  `]
})
export class QuickMatchComponent implements OnInit {
  matchCards: MatchCardDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  // TODO: Add pagination logic if needed

  constructor(private matchService: MatchService) {}

  ngOnInit(): void {
    this.loadPotentialMatches();
  }

  loadPotentialMatches(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.matchService.getPotentialMatches().subscribe({
      next: (matches: MatchCardDto[]) => {
        // Ensure matches have the userId property needed for filtering later
        this.matchCards = matches.filter(match => match && match.userId != null);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading potential matches:', err);
        this.errorMessage = 'Failed to load potential matches. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  // FIX: Call matchService.likeMatch
  accept(targetUserId: number): void {
    if (targetUserId == null) {
      console.error("Accept called with null/undefined userId");
      return;
    }
    this.handleMatchAction(this.matchService.likeMatch(targetUserId), targetUserId, 'accept');
  }

  // FIX: Call matchService.skipMatch
  reject(targetUserId: number): void {
    if (targetUserId == null) {
      console.error("Reject called with null/undefined userId");
      return;
    }
    this.handleMatchAction(this.matchService.skipMatch(targetUserId), targetUserId, 'reject');
  }

  // FIX: Created a helper function to handle the common logic for accept/reject
  private handleMatchAction(actionObservable: Observable<any>, targetUserId: number, actionType: 'accept' | 'reject'): void {
    actionObservable.subscribe({
      next: (response: any) => { // response body is now {}
        console.log(`Match action ${actionType} successful for user ${targetUserId}. Response:`, response);
        // Remove the card from the list on success
        this.matchCards = this.matchCards.filter(card => card.userId !== targetUserId);
        if (this.matchCards.length === 0) {
          // Optionally load more matches if the list becomes empty
          // this.loadPotentialMatches();
        }
      },
      error: (err: any) => { // Error handler
        console.error(`Error processing match action (${actionType}) for user ${targetUserId}:`, err);
        let displayMessage = `Failed to ${actionType} match. Please try again.`;

        if (err instanceof HttpErrorResponse) {
          // Attempt to extract a more specific message if available
          if (err.error && typeof err.error === 'object' && err.error.message) {
            displayMessage = `Failed to ${actionType} match: ${err.error.message}`;
          } else if (typeof err.error === 'string') {
            try {
              // Check for HTML again just in case
              if (err.error.startsWith('<!DOCTYPE html>')) {
                displayMessage = `Failed to ${actionType} match (received unexpected HTML response).`;
              } else {
                const parsedError = JSON.parse(err.error);
                displayMessage = `Failed to ${actionType} match: ${parsedError.message || 'Unknown error'}`;
              }
            } catch (e) {
              // If it's not HTML and not JSON, use status text or default
              displayMessage = `Failed to ${actionType} match. Status: ${err.statusText} (${err.status})`;
            }
          } else if (err.message) {
            displayMessage = err.message;
          } else {
            displayMessage = `Failed to ${actionType} match. Status: ${err.statusText} (${err.status})`;
          }
        }
        this.errorMessage = displayMessage;
        // Clear the error after a delay
        setTimeout(() => this.errorMessage = null, 7000);
      }
    });
  }

  // Helper to format lists for display
  formatList(items: any[] | undefined): string {
    if (!items || items.length === 0) {
      return 'None';
    }
    // Ensure item exists and has name or courseCode before accessing
    return items.map(item => item ? (item.name || item.courseCode || 'Unknown') : 'Unknown').join(', ');
  }
}
