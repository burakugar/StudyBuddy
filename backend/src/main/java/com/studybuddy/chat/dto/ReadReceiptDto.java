package com.studybuddy.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptDto {
    private Long messageId;
    private Long chatId;
    private ZonedDateTime readTimestamp;
}
