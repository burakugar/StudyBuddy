package com.studybuddy.chat;

import com.studybuddy.chat.dto.ChatInfoDto;
import com.studybuddy.chat.dto.ChatMessageDto;
import com.studybuddy.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Get all chats for the current user
     */
    @GetMapping
    public ResponseEntity<List<ChatInfoDto>> getUserChats(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(chatService.getChatsForUser(currentUser.getId()));
    }

    /**
     * Get all messages in a specific chat
     */
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getChatMessages(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        
        return ResponseEntity.ok(chatService.getMessagesForChat(chatId, currentUser.getId()));
    }
}
