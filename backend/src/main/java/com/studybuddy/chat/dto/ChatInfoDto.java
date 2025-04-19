package com.studybuddy.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatInfoDto {
    
    private Long chatId;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserAvatarUrl;
    private String lastMessageContent;
    private ZonedDateTime lastMessageTimestamp;
}
