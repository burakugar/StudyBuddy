package com.studybuddy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    
    private Long messageId; // Optional, can be null for new messages
    
    @NotNull(message = "Chat ID is required")
    private Long chatId;
    
    private Long senderId; // Set by the server
    
    private String senderName; // Optional, can be added by the backend
    
    @NotBlank(message = "Message content cannot be empty")
    private String content;
    
    private ZonedDateTime timestamp; // Set by server
}
