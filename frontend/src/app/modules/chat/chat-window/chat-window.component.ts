import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatInfoDto, ChatMessageDto, ReadReceipt } from '../../../core/models/chat.models';
import { Subscription, Subject } from 'rxjs';
import { finalize, switchMap, take, map, tap, debounceTime, filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessageDto[] = [];
  newMessage: string = '';
  chatId!: number;
  currentUserId: number;
  otherUserName: string = 'Study Buddy';
  otherUserAvatarUrl: string | null = null;
  isLoading = false;
  isSending = false;
  errorMessage: string | null = null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';

  private chatSubscription?: Subscription;
  private routeParamSubscription?: Subscription;
  private connectionStatusSubscription?: Subscription;
  private readReceiptSubscription?: Subscription;
  private shouldScrollToBottom = true;
  private isWindowVisible = true;
  private markReadDebouncer = new Subject<void>();
  defaultAvatar = environment.defaultAvatarUrl;

  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(event: Event) {
    this.isWindowVisible = document.visibilityState === 'visible';
    console.log(`[ChatWindow] Visibility changed: ${this.isWindowVisible}`);
    if (this.isWindowVisible && this.chatId) {
      this.triggerMarkAsRead();
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || 0;
    console.log(`[ChatWindow] Constructor - currentUserId: ${this.currentUserId}`);
  }

  ngOnInit(): void {
    console.log('[ChatWindow] ngOnInit');
    this.isWindowVisible = document.visibilityState === 'visible';

    if (!this.currentUserId) {
      this.errorMessage = 'User not authenticated. Please log in again.';
      console.error(`[ChatWindow] Invalid user ID: ${this.currentUserId}`);
      this.cdr.markForCheck();
      return;
    }

    this.routeParamSubscription = this.route.paramMap.subscribe(params => {
      const chatIdParam = params.get('chatId');
      if (!chatIdParam) {
        this.errorMessage = 'Chat ID not found in URL';
        console.error(`[ChatWindow] Chat ID not found in route params`);
        this.cdr.markForCheck();
        return;
      }
      const newChatId = parseInt(chatIdParam, 10);
      if (isNaN(newChatId) || newChatId <= 0) {
        this.errorMessage = 'Invalid chat ID';
        console.error(`[ChatWindow] Invalid chat ID: ${newChatId}`);
        this.cdr.markForCheck();
        return;
      }

      if (this.chatId && this.chatId !== newChatId) {
        this.cleanupSubscriptions();
      }
      this.chatId = newChatId;
      console.log(`[ChatWindow] Initializing for chatId: ${this.chatId}`);
      this.messages = [];
      this.otherUserName = 'Loading...';
      this.otherUserAvatarUrl = null;
      this.errorMessage = null;
      this.isLoading = true;
      this.cdr.markForCheck();
      this.initializeChat();
    });

    this.connectionStatusSubscription = this.chatService.connectionStatus$.subscribe(status => {
      console.log(`[ChatWindow] Connection status changed to: ${status}`);
      this.connectionStatus = status;
      this.cdr.markForCheck();
    });

    this.readReceiptSubscription = this.chatService.readReceipts$
      .pipe(filter((receipt: ReadReceipt) => receipt.chatId === this.chatId))
      .subscribe((receipt: ReadReceipt) => {
        console.log('[ChatWindow] Received read receipt via dedicated subject (may be redundant):', receipt);
      });

    this.markReadDebouncer.pipe(debounceTime(1000)).subscribe(() => {
      if (this.chatId && this.isWindowVisible) {
        this.chatService.markMessagesAsRead(this.chatId).subscribe({
          error: (err) => console.error("[ChatWindow] Failed to mark messages as read:", err)
        });
      }
    });
  }

  private cleanupSubscriptions(): void {
    console.log('[ChatWindow] Cleaning up previous chat subscriptions for chatId:', this.chatId);
    this.chatSubscription?.unsubscribe();
    if (this.chatId) {
      this.chatService.unsubscribeFromChat(this.chatId);
    }
  }

  private initializeChat(): void {
    console.log(`[ChatWindow] Initializing chat ${this.chatId}`);
    this.loadChatInfoAndMessages();
  }

  ngOnDestroy(): void {
    console.log('[ChatWindow] ngOnDestroy - cleaning up subscriptions');
    this.cleanupSubscriptions();
    this.connectionStatusSubscription?.unsubscribe();
    this.routeParamSubscription?.unsubscribe();
    this.readReceiptSubscription?.unsubscribe();
    this.markReadDebouncer.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private loadChatInfoAndMessages(): void {
    console.log('[ChatWindow] Loading chat info and initial messages for chat:', this.chatId);
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.chatService.getMyChats().pipe(
      map((chats: ChatInfoDto[]) => {
        const currentChat = chats.find(chat => chat.chatId === this.chatId);
        if (!currentChat) {
          throw new Error(`Chat #${this.chatId} not found or access denied.`);
        }
        return currentChat;
      }),
      tap((currentChat: ChatInfoDto) => {
        console.log('[ChatWindow] Found current chat info:', currentChat);
        this.otherUserName = currentChat.otherUserName;
        this.otherUserAvatarUrl = currentChat.otherUserAvatarUrl;
        this.cdr.markForCheck();
      }),
      switchMap(() => this.chatService.getChatMessages(this.chatId)),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (messages) => {
        console.log(`[ChatWindow] Received ${messages.length} initial messages`);
        this.messages = messages;
        this.shouldScrollToBottom = true;
        this.cdr.markForCheck();
        this.subscribeToChatMessages();
        this.triggerMarkAsRead();
      },
      error: (err) => {
        console.error('[ChatWindow] Error loading chat info or history:', err);
        this.errorMessage = err.message || 'Failed to load chat information or history. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }


  private subscribeToChatMessages(): void {
    if (!this.chatId) {
      console.warn('[ChatWindow] Cannot subscribe to messages, chatId is missing.');
      return;
    }
    console.log(`[ChatWindow] Subscribing to message updates for chat ${this.chatId}`);

    this.chatSubscription?.unsubscribe();

    this.chatSubscription = this.chatService.subscribeToChat(this.chatId)
      .subscribe({
        next: (updatedOrNewMessage) => {
          console.log('[ChatWindow] Received message update via subject:', updatedOrNewMessage);

          const existingMessageIndex = this.messages.findIndex(m => m.messageId === updatedOrNewMessage.messageId);

          if (existingMessageIndex > -1) {
            console.log(`[ChatWindow] Updating existing message ID ${updatedOrNewMessage.messageId}`);
            this.messages = this.messages.map((msg, index) =>
              index === existingMessageIndex ? updatedOrNewMessage : msg
            );
          } else {
            console.log(`[ChatWindow] Adding new message ID ${updatedOrNewMessage.messageId} to list.`);
            this.messages.push(updatedOrNewMessage);
            this.messages = [...this.messages];
            this.shouldScrollToBottom = this.isUserNearBottom();
            if (updatedOrNewMessage.senderId !== this.currentUserId && this.isWindowVisible) {
              this.triggerMarkAsRead();
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[ChatWindow] Error in chat subscription observable:', err);
          this.errorMessage = 'Lost connection to chat updates. Please refresh.';
          this.connectionStatus = 'error';
          this.cdr.markForCheck();
        },
        complete: () => {
          console.log(`[ChatWindow] Message subscription completed for chat ${this.chatId}.`);
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.isSending || this.isLoading || !this.chatId) {
      return;
    }
    if (this.connectionStatus !== 'connected') {
      this.errorMessage = 'Cannot send message: Not connected.';
      this.cdr.markForCheck();
      return;
    }

    console.log('[ChatWindow] Preparing to send message:', this.newMessage);
    this.isSending = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const messageDto: ChatMessageDto = {
      chatId: this.chatId,
      content: this.newMessage.trim(),
      senderId: this.currentUserId,
      timestamp: new Date(),
    };

    const messageToSend = this.newMessage;
    this.newMessage = '';

    this.chatService.sendMessage(messageDto)
      .pipe(finalize(() => {
        this.isSending = false;
        this.cdr.markForCheck();
        this.focusMessageInput();
      }))
      .subscribe({
        next: (savedMsg) => {
          console.log('[ChatWindow] sendMessage observable success (UI update handled by subject):', savedMsg);
          this.shouldScrollToBottom = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[ChatWindow] Error sending message:', err.originalError || err);
          this.errorMessage = err.message || 'Failed to send message. Please try again.';
          this.newMessage = messageToSend;
          this.cdr.markForCheck();
          setTimeout(() => { if(this.errorMessage === err.message) this.errorMessage = null; this.cdr.markForCheck(); }, 5000);
        }
      });
  }


  triggerMarkAsRead(): void {
    if(this.isWindowVisible && this.chatId) {
      console.debug('[ChatWindow] Debouncing markAsRead trigger');
      this.markReadDebouncer.next();
    } else {
      console.debug('[ChatWindow] Window not visible or no chatId, skipping markAsRead trigger');
    }
  }

  private handleReadReceipt(receipt: ReadReceipt): void {
    console.log('[ChatWindow] Handling read receipt via dedicated subject (may be redundant):', receipt);
    let messageUpdated = false;
    const newMessages = this.messages.map(msg => {
      if (msg.messageId && msg.messageId === receipt.messageId && !msg.readTimestamp) {
        messageUpdated = true;
        return { ...msg, readTimestamp: receipt.readTimestamp };
      }
      return msg;
    });

    if (messageUpdated) {
      this.messages = newMessages;
      console.log(`[ChatWindow] Updated read timestamp for message ${receipt.messageId} via dedicated subject.`);
      this.cdr.markForCheck();
    }
  }

  private isUserNearBottom(): boolean {
    const threshold = 50;
    const element = this.messageContainer?.nativeElement;
    if (!element) return true;
    const position = element.scrollTop + element.offsetHeight;
    const height = element.scrollHeight;
    return height - position < threshold;
  }


  private scrollToBottom(): void {
    try {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        this.shouldScrollToBottom = false;
      }
    } catch (err) {
      console.error('[ChatWindow] Error scrolling to bottom:', err);
    }
  }

  private focusMessageInput(): void {
    try {
      setTimeout(() => this.messageInput?.nativeElement?.focus(), 0);
    } catch (err) {
      console.error('[ChatWindow] Error focusing input:', err);
    }
  }

  formatTimestamp(timestamp: Date | string | undefined): string {
    if (!timestamp) return '';
    const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric'}) + ' ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  }

  isOwnMessage(senderId: number): boolean {
    return senderId === this.currentUserId;
  }

  trackByMessageId(index: number, item: ChatMessageDto): number | string | undefined {
    return item.messageId ?? `temp-${index}`;
  }

  reconnect(): void {
    console.log('[ChatWindow] Attempting to reconnect polling/refresh');
    this.connectionStatus = 'connecting';
    this.errorMessage = null;
    this.cdr.markForCheck();
    if (this.chatId) {
      this.initializeChat();
    }
  }

  getConnectionStatusMessage(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  }
}
