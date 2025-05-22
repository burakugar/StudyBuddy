package com.studybuddy.chat;

import com.studybuddy.chat.dto.ChatMessageDto;
import com.studybuddy.chat.dto.MarkReadRequestDto; // Create this DTO
import com.studybuddy.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload @Valid ChatMessageDto messageDto, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        log.debug("Received sendMessage from {}: {}", userDetails.getUsername(), messageDto);
        chatService.saveAndBroadcastMessage(messageDto, userDetails.getId());
    }

    @MessageMapping("/chat.markRead")
    public void markMessagesAsRead(@Payload @Valid MarkReadRequestDto request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        log.debug("Received markRead request from {} for chat {}", userDetails.getUsername(), request.getChatId());
        chatService.markMessagesAsRead(request.getChatId(), userDetails.getId());
    }
}
