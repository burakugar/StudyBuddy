package com.studybuddy.chat;

import com.studybuddy.chat.dto.ChatMessageDto;
import com.studybuddy.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MessageController {

    private final ChatService chatService;

    /**
     * WebSocket endpoint for sending chat messages
     * Client sends to: /app/chat.sendMessage
     * Server broadcasts to: /topic/chats/{chatId}
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload @Valid ChatMessageDto messageDto, Authentication authentication) {
        // Extract user details from authentication
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Save and broadcast the message
        chatService.saveAndBroadcastMessage(messageDto, userDetails.getId());
    }
}
