import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// Import Observable, BehaviorSubject, Subject, throwError, EMPTY, ObservableInput
import { Observable, BehaviorSubject, Subject, throwError, timer, Subscription, of, EMPTY, ObservableInput } from 'rxjs';
import { map, tap, catchError, finalize, switchMap, take, retry, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ChatInfoDto, ChatMessageDto, ReadReceipt } from '../models/chat.models';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private readonly API_URL = `${environment.apiUrl}/chats`;
  private chatSubscriptions = new Map<number, Subscription>();
  private messageUpdateSubjects = new Map<number, Subject<ChatMessageDto>>();
  private lastMessages = new Map<number, ChatMessageDto[]>();
  private isBrowser: boolean;
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('disconnected');
  private readReceiptsSubject = new Subject<ReadReceipt>(); // Keep for potential future use

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public readReceipts$ = this.readReceiptsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    console.log('[ChatService] Constructor. isBrowser:', this.isBrowser);
    if (this.isBrowser) {
      this.connectionStatusSubject.next('connected');
      console.log('[ChatService] Initialized with HTTP polling. Status set to connected.');
    }
  }

  ngOnDestroy(): void {
    console.log('[ChatService] ngOnDestroy - Cleaning up polling');
    this.disconnect();
  }

  getMyChats(): Observable<ChatInfoDto[]> {
    console.log('[ChatService] Fetching chats from API:', this.API_URL);
    return this.http.get<ChatInfoDto[]>(`${this.API_URL}`).pipe(
      map(chats => chats.map(chat => ({
        ...chat,
        lastMessageTimestamp: chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp) : null
      }))),
      tap(chats => console.log('[ChatService] Received chats:', chats.length)),
      catchError(err => this.handleError(err, 'getMyChats'))
    );
  }

  getChatMessages(chatId: number): Observable<ChatMessageDto[]> {
    console.log(`[ChatService] Fetching messages for chat ${chatId}`);
    return this.http.get<ChatMessageDto[]>(`${this.API_URL}/${chatId}/messages`).pipe(
      map(messages => messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        readTimestamp: msg.readTimestamp ? new Date(msg.readTimestamp) : null
      }))),
      tap(messages => {
        console.log(`[ChatService] Received ${messages.length} messages for chat ${chatId}`);
        this.lastMessages.set(chatId, messages); // Update cache on initial load
      }),
      catchError(err => this.handleError(err, `getChatMessages chatId=${chatId}`))
    );
  }

  sendMessage(messageDto: ChatMessageDto): Observable<ChatMessageDto> {
    console.log(`[ChatService] Sending message via HTTP POST to chat ${messageDto.chatId}`);
    const payload = {
      chatId: messageDto.chatId,
      senderId: messageDto.senderId,
      content: messageDto.content
    };
    return this.http.post<ChatMessageDto>(`${this.API_URL}/${messageDto.chatId}/messages`, payload).pipe(
      map(savedMsg => ({ 
        ...savedMsg,
        timestamp: new Date(savedMsg.timestamp),
        readTimestamp: savedMsg.readTimestamp ? new Date(savedMsg.readTimestamp) : null
      })),
      tap(savedMsg => {
        console.log('[ChatService] Message POST successful. Backend returned:', savedMsg);
        const subject = this.messageUpdateSubjects.get(savedMsg.chatId);
        if (subject) {
          console.log(`[ChatService] Pushing saved message ID ${savedMsg.messageId} to subject for chat ${savedMsg.chatId}`);
          subject.next(savedMsg);
        }
        const currentMessages = this.lastMessages.get(savedMsg.chatId) || [];
        if (!currentMessages.some(m => m.messageId === savedMsg.messageId)) {
          this.lastMessages.set(savedMsg.chatId, [...currentMessages, savedMsg]);
        }
      }),
      catchError(err => this.handleError(err, `sendMessage chatId=${messageDto.chatId}`))
    );
  }

  markMessagesAsRead(chatId: number): Observable<void> {
    console.log(`[ChatService] Marking messages as read via HTTP POST for chat ${chatId}`);
    return this.http.post<void>(`${this.API_URL}/${chatId}/read`, {}).pipe(
      tap(() => console.log(`[ChatService] Mark as read request sent successfully for chat ${chatId}`)),
      catchError(err => this.handleError(err, `markMessagesAsRead chatId=${chatId}`))
    );
  }

  /**
   * Sets up HTTP polling for a specific chat to detect new messages and read receipts.
   * Returns an Observable that emits *new* or *updated* (read status change) messages.
   */
  subscribeToChat(chatId: number): Observable<ChatMessageDto> {
    console.log(`[ChatService] Subscribing to message UPDATES for chat ${chatId} via polling.`);

    // 1. Ensure Subject exists
    if (!this.messageUpdateSubjects.has(chatId)) {
      console.log(`[ChatService] Creating new message update Subject for chat ${chatId}.`);
      this.messageUpdateSubjects.set(chatId, new Subject<ChatMessageDto>());
    }
    const messageUpdateSubject = this.messageUpdateSubjects.get(chatId);

    if (!messageUpdateSubject) {
      console.error(`[ChatService] CRITICAL: Failed to get/create message subject for chat ${chatId} before polling setup.`);
      return EMPTY;
    }

    this.unsubscribeFromChat(chatId);

    const pollingInterval = 5000; 
    console.log(`[ChatService] Setting up polling timer for chat ${chatId} interval ${pollingInterval}ms.`);
    const pollingSubscription = timer(0, pollingInterval).pipe( 
      switchMap(() => {
        return this.http.get<ChatMessageDto[]>(`${this.API_URL}/${chatId}/messages`).pipe(
          map(messages => messages.map(msg => ({ 
            ...msg,
            timestamp: new Date(msg.timestamp),
            readTimestamp: msg.readTimestamp ? new Date(msg.readTimestamp) : null
          }))),
          catchError(err => {
            console.error(`[ChatService] Error fetching messages during polling for chat ${chatId}:`, err);
            this.connectionStatusSubject.next('error');
            return of([]); 
          })
        );
      }),
      tap(fetchedMessages => {
        const knownMessagesMap = new Map((this.lastMessages.get(chatId) || []).map(m => [m.messageId, m]));
        let updatedMessagesFound = false;

        fetchedMessages.forEach(fetchedMsg => {
          if (!fetchedMsg.messageId) return;

          const knownMsg = knownMessagesMap.get(fetchedMsg.messageId);

          if (!knownMsg) {
            console.log(`[ChatService] New message found via polling in chat ${chatId}: ID ${fetchedMsg.messageId}`);
            messageUpdateSubject.next(fetchedMsg);
            updatedMessagesFound = true;
          } else {
            if (!knownMsg.readTimestamp && fetchedMsg.readTimestamp) {
              console.log(`[ChatService] Read receipt found via polling for message ${fetchedMsg.messageId} in chat ${chatId}.`);
              messageUpdateSubject.next(fetchedMsg); // Emit updated message
              updatedMessagesFound = true;
            }
          }
        });

        if (updatedMessagesFound || fetchedMessages.length !== knownMessagesMap.size) {
          this.lastMessages.set(chatId, fetchedMessages);
        }
      })
    ).subscribe({
      error: (err) => {
        console.error(`[ChatService] Unrecoverable error in polling subscription for chat ${chatId}:`, err);
        this.connectionStatusSubject.next('error');
        this.unsubscribeFromChat(chatId);
      }
    });

    this.chatSubscriptions.set(chatId, pollingSubscription);

    console.log(`[ChatService] Returning asObservable for chat ${chatId}. Subject defined: ${!!messageUpdateSubject}`);
    return messageUpdateSubject.asObservable();
  }

  unsubscribeFromChat(chatId: number): void {
    const subscription = this.chatSubscriptions.get(chatId);
    if (subscription) {
      console.log(`[ChatService] Unsubscribing from polling for chat ${chatId}`);
      subscription.unsubscribe();
      this.chatSubscriptions.delete(chatId);
    }
  }

  disconnect(): void {
    console.log('[ChatService] Disconnecting - Clearing all polling subscriptions and subjects.');
    this.chatSubscriptions.forEach(sub => sub.unsubscribe());
    this.chatSubscriptions.clear();
    this.messageUpdateSubjects.forEach(sub => sub.complete());
    this.messageUpdateSubjects.clear();
    this.lastMessages.clear();
    this.connectionStatusSubject.next('disconnected');
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  // Error handler returns Observable<never>
  private handleError(error: HttpErrorResponse, operation = 'operation'): Observable<never> {
    console.error(`[ChatService] ${operation} failed: ${error.message}`, error);
    this.connectionStatusSubject.next('error');

    let userMessage = `Operation '${operation}' failed. `;
    if (error.status === 0) {
      userMessage += 'Unable to connect to the server. Please check your network connection.';
    } else {
      const backendMessage = error.error?.message || error.error?.error || (typeof error.error === 'string' ? error.error : null);
      userMessage += `Server responded with status ${error.status}`;
      if (backendMessage) {
        userMessage += `: ${backendMessage}`;
      } else {
        userMessage += `. ${error.statusText || 'Unknown server error'}`;
      }
    }

    return throwError(() => ({
      message: userMessage,
      status: error.status,
      originalError: error
    }));
  }
}
