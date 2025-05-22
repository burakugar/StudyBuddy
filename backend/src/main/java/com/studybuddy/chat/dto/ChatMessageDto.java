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

    private Long messageId;

    @NotNull(message = "Chat ID is required")
    private Long chatId;

    private Long senderId;

    private String senderName;

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    private ZonedDateTime timestamp;

    private ZonedDateTime readTimestamp;
}
