import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectionStrategy and ChangeDetectorRef
import { MatchService } from '../../../core/services/matching.service';
import { MatchCardDto } from '../../../core/models/matching.models';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CourseDto } from '../../../core/models/course.models'; // Import correct DTOs
import { InterestDto } from '../../../core/models/interest.models'; // Import correct DTOs


@Component({
  selector: 'app-quick-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-match.component.html',
  styleUrls: ['./quick-match.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Add OnPush strategy
})
export class QuickMatchComponent implements OnInit {
  matchCards: MatchCardDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  processingIds: Set<number> = new Set();
  defaultAvatar = environment.defaultAvatarUrl;

  constructor(
    private matchService: MatchService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPotentialMatches();
  }

  loadPotentialMatches(): void {
    if (this.isLoading) return; // Prevent multiple loads

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck(); // Mark for check when starting async operation
    console.log('[QuickMatch] Loading potential matches...');

    this.matchService.getPotentialMatches()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck(); // Mark for check when async operation completes
      }))
      .subscribe({
        next: (matches: MatchCardDto[]) => {
          console.log(`[QuickMatch] Received ${matches.length} potential matches.`);
          this.matchCards = matches.filter(match => match && match.userId != null);
          if (this.matchCards.length === 0 && matches.length > 0) {
            console.warn('[QuickMatch] Filtered out all matches due to missing userId property.');
          } else if (this.matchCards.length === 0) {
            console.log('[QuickMatch] No potential matches found.');
          }
          this.cdr.markForCheck(); // Mark for check after updating data
        },
        error: (err: any) => {
          console.error('[QuickMatch] Error loading potential matches:', err);
          const message = err?.error?.error || err?.error?.message || err?.message || 'Failed to load potential matches. Please try again later.';
          this.errorMessage = message;
          this.cdr.markForCheck(); // Mark for check on error
        }
      });
  }

  accept(userId: number): void {
    if (!userId || this.processingIds.has(userId)) {
      console.warn(`[QuickMatch] Accept action skipped for user ${userId}. Already processing or invalid ID.`);
      return;
    }
    console.log(`[QuickMatch] Accepting user ${userId}...`);
    this.processingIds.add(userId); // Add ID immediately
    this.cdr.markForCheck(); // Update UI to show processing state
    this.handleMatchAction(userId, this.matchService.likeMatch(userId));
  }

  reject(userId: number): void {
    if (!userId || this.processingIds.has(userId)) {
      console.warn(`[QuickMatch] Reject action skipped for user ${userId}. Already processing or invalid ID.`);
      return;
    }
    console.log(`[QuickMatch] Rejecting user ${userId}...`);
    this.processingIds.add(userId); // Add ID immediately
    this.cdr.markForCheck(); // Update UI to show processing state
    this.handleMatchAction(userId, this.matchService.skipMatch(userId));
  }

  private handleMatchAction(userId: number, actionObservable: Observable<any>): void {
    this.errorMessage = null;
    const cardElement = document.getElementById(`match-card-${userId}`);

    actionObservable
      .pipe(finalize(() => {
        this.processingIds.delete(userId);
        this.cdr.markForCheck(); // Mark for check after action completes
      }))
      .subscribe({
        next: (response) => {
          console.log(`[QuickMatch] Action successful for user ${userId}. Response:`, response);
          // Remove card from list efficiently
          const index = this.matchCards.findIndex(card => card.userId === userId);
          if (index > -1) {
            this.matchCards.splice(index, 1);
            // Create a new array reference for OnPush change detection
            this.matchCards = [...this.matchCards];
          }

          if (this.matchCards.length < 3 && !this.isLoading) {
            console.log('[QuickMatch] Low on matches, loading more...');
            this.loadPotentialMatches();
          } else if (this.matchCards.length === 0) {
            console.log('[QuickMatch] No matches left after action.');
          }
          this.cdr.markForCheck(); // Mark for check after data modification
        },
        error: (err: any) => {
          console.error(`[QuickMatch] Error processing action for user ${userId}:`, err);
          const message = err?.error?.error || err?.error?.message || err?.message || 'Failed to process match action. Please try again.';
          this.errorMessage = message;
          this.cdr.markForCheck(); // Mark for check on error
          setTimeout(() => { if(this.errorMessage === message) this.errorMessage = null; this.cdr.markForCheck(); }, 5000);
        }
      });
  }

  formatList(items: CourseDto[] | InterestDto[] | undefined): string {
    if (!items || items.length === 0) {
      return 'None';
    }
    return items.map(item => {
      if (!item) return 'Unknown';
      if ('courseCode' in item && item.courseCode) return item.courseCode;
      if ('name' in item && item.name) return item.name;
      return 'Unknown';
    }).filter(name => name !== 'Unknown').join(', ') || 'None';
  }

  // *** ADD THIS METHOD FOR trackBy ***
  trackByUserId(index: number, item: MatchCardDto): number {
    return item.userId;
  }
}
