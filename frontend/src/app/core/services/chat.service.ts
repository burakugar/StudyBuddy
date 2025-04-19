import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ChatInfoDto, ChatMessageDto } from '../models/chat.models';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_URL = `${environment.apiUrl}/chats`;
  private stompClient?: Client;
  private chatSubscriptions: Map<number, Subject<ChatMessageDto>> = new Map();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Get all chats for the current user
   */
  getMyChats(): Observable<ChatInfoDto[]> {
    return this.http.get<ChatInfoDto[]>(`${this.API_URL}`);
  }

  /**
   * Get all messages for a specific chat
   */
  getChatMessages(chatId: number): Observable<ChatMessageDto[]> {
    return this.http.get<ChatMessageDto[]>(`${this.API_URL}/${chatId}/messages`);
  }

  /**
   * Send a message to a chat
   */
  sendMessage(messageDto: ChatMessageDto): Observable<any> {
    if (this.isBrowser && this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messageDto)
      });
      // Return an observable that emits null and completes immediately
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    } else {
      // Fallback to HTTP if WebSocket is not connected or we're not in a browser
      return this.http.post(`${this.API_URL}/${messageDto.chatId}/messages`, messageDto);
    }
  }

  /**
   * Subscribe to a specific chat
   */
  subscribeToChat(chatId: number): Observable<ChatMessageDto> {
    // Create a new subject if one doesn't exist for this chat
    if (!this.chatSubscriptions.has(chatId)) {
      const chatSubject = new Subject<ChatMessageDto>();
      this.chatSubscriptions.set(chatId, chatSubject);

      // Only initialize WebSocket connection if in browser
      if (this.isBrowser) {
        // Initialize connection if not already connected
        this.initializeWebSocketConnection();

        // Subscribe to the WebSocket topic once connected
        if (this.stompClient && this.stompClient.connected) {
          this.subscribeToWebSocketTopic(chatId);
        } else if (this.stompClient) {
          // If client exists but not connected, subscribe when connected
          this.stompClient.onConnect = () => {
            this.subscribeToWebSocketTopic(chatId);
          };
        }
      }
    }

    // Return the subject as an observable
    return this.chatSubscriptions.get(chatId)!.asObservable();
  }

  /**
   * Unsubscribe from a specific chat
   */
  unsubscribeFromChat(chatId: number): void {
    const subscription = this.chatSubscriptions.get(chatId);
    if (subscription) {
      subscription.complete();
      this.chatSubscriptions.delete(chatId);
    }
  }

  /**
   * Initialize WebSocket connection
   */
  private initializeWebSocketConnection(): void {
    if (!this.isBrowser) {
      return; // Don't attempt WebSocket connection on server
    }

    if (this.stompClient && this.stompClient.connected) {
      return; // Already connected
    }

    // Create the STOMP client with SockJS
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.websocketUrl),
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken()}`
      },
      debug: function(str) {
        // Uncomment for debugging
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    // Set up connect handler
    this.stompClient.onConnect = () => {
      console.log('WebSocket connection established');
      // Subscribe to all existing chat topics
      this.chatSubscriptions.forEach((_, chatId) => {
        this.subscribeToWebSocketTopic(chatId);
      });
    };

    // Set up error handler
    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
    };

    // Activate the client
    this.stompClient.activate();
  }

  /**
   * Subscribe to WebSocket topic for a specific chat
   */
  private subscribeToWebSocketTopic(chatId: number): void {
    if (!this.isBrowser || !this.stompClient || !this.stompClient.connected) {
      console.error('Cannot subscribe: WebSocket not connected or not in browser environment');
      return;
    }

    // Subscribe to the chat topic
    this.stompClient.subscribe(`/topic/chats/${chatId}`, (message: IMessage) => {
      try {
        const chatMessage: ChatMessageDto = JSON.parse(message.body);
        const subject = this.chatSubscriptions.get(chatId);
        if (subject) {
          subject.next(chatMessage);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.isBrowser && this.stompClient) {
      this.stompClient.deactivate();
    }
    // Complete all subscriptions
    this.chatSubscriptions.forEach(subject => subject.complete());
    this.chatSubscriptions.clear();
  }
}
