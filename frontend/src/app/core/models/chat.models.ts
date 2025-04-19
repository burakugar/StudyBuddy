export interface ChatInfoDto {
  chatId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  lastMessageContent: string | null;
  lastMessageTimestamp: Date | null;
}

export interface ChatMessageDto {
  messageId?: number;
  chatId: number;
  senderId: number;
  senderName?: string;
  content: string;
  timestamp: Date;
}
