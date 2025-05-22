import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { ChatInfoDto } from '../../../core/models/chat.models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats: ChatInfoDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  currentUserId: number | null = null;
  private connectionStatusSubscription?: Subscription;
  defaultAvatar = environment.defaultAvatarUrl;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('[ChatListComponent] Constructor executed.');
  }

  ngOnInit(): void {
    console.log('[ChatListComponent] ngOnInit started.');

    try {
      const currentUser = this.authService.getCurrentUser();
      this.currentUserId = currentUser?.id ?? null;
      console.log('[ChatListComponent] Current User ID:', this.currentUserId);

      if (!this.currentUserId) {
        console.warn('[ChatListComponent] User ID not found. Cannot load chats.');
        this.errorMessage = 'User not authenticated. Please log in again.';
        this.cdr.markForCheck();
        return;
      }

      this.connectionStatusSubscription = this.chatService.connectionStatus$.subscribe(status => {
        console.log(`[ChatListComponent] WebSocket status: ${status}`);
        if (status === 'connected' && this.chats.length === 0 && !this.isLoading) {
        }
        this.cdr.markForCheck();
      });

      this.loadChats();
    } catch (error) {
      console.error('[ChatListComponent] Critical error during ngOnInit:', error);
      this.errorMessage = 'An unexpected error occurred while initializing the chat list.';
      this.cdr.markForCheck();
    }

    console.log('[ChatListComponent] ngOnInit finished.');
  }

  ngOnDestroy(): void {
    console.log('[ChatListComponent] ngOnDestroy');
    this.connectionStatusSubscription?.unsubscribe();
  }

  loadChats(): void {
    console.log('[ChatListComponent] loadChats called.');
    if (!this.currentUserId) {
      console.warn('[ChatListComponent] loadChats prevented: No user ID.');
      this.errorMessage = 'User not authenticated. Please log in again.';
      this.cdr.markForCheck();
      return;
    }
    if (this.isLoading) {
      console.log('[ChatListComponent] loadChats prevented: Already loading.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    console.log('[ChatListComponent] Fetching chats from service...');
    this.chatService.getMyChats()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (fetchedChats: ChatInfoDto[]) => {
          console.log(`[ChatListComponent] Received ${fetchedChats.length} chats`);
          this.chats = fetchedChats.sort((a, b) => {
            const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
            const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
            return timeB - timeA;
          });
          console.log('[ChatListComponent] Chats loaded and sorted.');
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('[ChatListComponent] Error loading chats:', err);
          this.errorMessage = err?.error?.message || err?.message || 'Failed to load chats. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  truncateMessage(content: string | null | undefined, maxLength: number = 40): string {
    if (!content) {
      return 'No messages yet';
    }
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  retryLoading(): void {
    this.loadChats();
  }

  trackByChatId(index: number, chat: ChatInfoDto): number {
    return chat.chatId;
  }
}
