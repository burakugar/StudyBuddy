package com.studybuddy.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarkReadRequestDto {
    @NotNull(message = "Chat ID is required to mark messages as read")
    private Long chatId;
}
