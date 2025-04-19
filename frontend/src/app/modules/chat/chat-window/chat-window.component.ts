import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatMessageDto } from '../../../core/models/chat.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessageDto[] = [];
  newMessage: string = '';
  chatId: number;
  currentUserId: number;
  otherUserName: string = 'Study Buddy';  // Default value
  isLoading = false;
  errorMessage: string | null = null;
  private chatSubscription?: Subscription;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthService
  ) {
    this.chatId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || 0;
  }

  ngOnInit(): void {
    if (!this.chatId || !this.currentUserId) {
      this.errorMessage = 'Invalid chat or user information';
      return;
    }

    // Load chat info first to get other user's name
    this.chatService.getMyChats().subscribe({
      next: (chats: any[]) => {
        const currentChat = chats.find(chat => chat.chatId === this.chatId);
        if (currentChat) {
          this.otherUserName = currentChat.otherUserName;
        }
        this.loadChatHistory();
        this.subscribeToChat();
      },
      error: (err: any) => {
        console.error('Error loading chat info:', err);
        this.errorMessage = 'Failed to load chat information.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    // Disconnect from WebSocket chat room
    this.chatService.unsubscribeFromChat(this.chatId);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private loadChatHistory(): void {
    this.isLoading = true;
    this.chatService.getChatMessages(this.chatId).subscribe({
      next: (messages: ChatMessageDto[]) => {
        this.messages = messages;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (err: any) => {
        console.error('Error loading chat history:', err);
        this.errorMessage = 'Failed to load chat history. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private subscribeToChat(): void {
    this.chatSubscription = this.chatService.subscribeToChat(this.chatId)
      .subscribe({
        next: (message: ChatMessageDto) => {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        },
        error: (err: any) => {
          console.error('Error in chat subscription:', err);
          this.errorMessage = 'Lost connection to chat. Please refresh the page.';
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }

    const messageDto: ChatMessageDto = {
      chatId: this.chatId,
      content: this.newMessage.trim(),
      senderId: this.currentUserId,
      timestamp: new Date()
    };

    this.chatService.sendMessage(messageDto).subscribe({
      next: () => {
        this.newMessage = '';
        this.focusMessageInput();
      },
      error: (err: any) => {
        console.error('Error sending message:', err);
        this.errorMessage = 'Failed to send message. Please try again.';
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottom = false;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private focusMessageInput(): void {
    try {
      this.messageInput.nativeElement.focus();
    } catch (err) {
      console.error('Error focusing input:', err);
    }
  }

  // Helper to format message timestamp
  formatTimestamp(timestamp: Date | string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Helper to check if message is from current user
  isOwnMessage(senderId: number): boolean {
    return senderId === this.currentUserId;
  }
}
