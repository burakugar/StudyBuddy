// frontend/src/app/modules/chat/chat.routes.ts
import { Routes } from '@angular/router';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';

export const CHAT_ROUTES: Routes = [
  {
    path: '', 
    component: ChatListComponent
  },
  {
    path: ':chatId', 
    component: ChatWindowComponent
  }
];
