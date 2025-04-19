// frontend/src/app/modules/chat/chat-list/chat-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { ChatInfoDto } from '../../../core/models/chat.models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit {
  chats: ChatInfoDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  currentUserId: number | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {
    console.log('[ChatListComponent] Constructor executed.'); // <<< ADDED LOG
  }

  ngOnInit(): void {
    console.log('[ChatListComponent] ngOnInit started.'); // <<< ADDED LOG
    try {
      this.currentUserId = this.authService.getCurrentUser()?.id ?? null;
      console.log('[ChatListComponent] Current User ID:', this.currentUserId); // <<< ADDED LOG

      if (!this.currentUserId) {
        console.warn('[ChatListComponent] User ID not found. Cannot load chats.'); // <<< ADDED LOG
        // Keep the existing error message logic for the template
        this.errorMessage = 'User not authenticated. Cannot load chats.';
        this.isLoading = false; // Ensure loading is false if we stop early
        return;
      }

      this.loadChats();
    } catch (error) {
      console.error('[ChatListComponent] Critical error during ngOnInit:', error); // <<< ADDED LOG
      this.errorMessage = 'An unexpected error occurred while initializing the chat list.';
      this.isLoading = false;
    }
    console.log('[ChatListComponent] ngOnInit finished.'); // <<< ADDED LOG
  }

  loadChats(): void {
    console.log('[ChatListComponent] loadChats called.'); // <<< ADDED LOG
    // Redundant check, but safe
    if (!this.currentUserId) {
      console.warn('[ChatListComponent] loadChats prevented: No user ID.'); // <<< ADDED LOG
      this.errorMessage = 'User not authenticated.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    console.log('[ChatListComponent] Fetching chats from service...'); // <<< ADDED LOG
    this.chatService.getMyChats().subscribe({
      next: (chats: ChatInfoDto[]) => {
        console.log('[ChatListComponent] Received chats:', chats); // <<< ADDED LOG
        this.chats = chats.sort((a: ChatInfoDto, b: ChatInfoDto) => {
          const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
          const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
          return timeB - timeA;
        });
        this.isLoading = false;
        console.log('[ChatListComponent] Chats loaded and sorted.'); // <<< ADDED LOG
      },
      error: (err: any) => {
        console.error('[ChatListComponent] Error loading chats:', err); // <<< ADDED LOG
        this.errorMessage = 'Failed to load chats. Please try again later.';
        if (err.error?.message) {
          this.errorMessage += ` (Server: ${err.error.message})`; // Add server message if available
        }
        this.isLoading = false;
      }
    });
  }

  // Helper to truncate long messages
  truncateMessage(content: string | null | undefined, maxLength: number = 30): string {
    if (!content) {
      return 'No messages yet';
    }
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
}
