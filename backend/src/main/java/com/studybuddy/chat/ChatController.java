package com.studybuddy.chat;

import com.studybuddy.chat.dto.ChatInfoDto;
import com.studybuddy.chat.dto.ChatMessageDto;
import com.studybuddy.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    /**
     * Get all chats for the current user
     */
    @GetMapping
    public ResponseEntity<List<ChatInfoDto>> getUserChats(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("API GET /api/chats requested by user {}", currentUser.getId());
        return ResponseEntity.ok(chatService.getChatsForUser(currentUser.getId()));
    }

    /**
     * Get all messages in a specific chat
     */
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getChatMessages(
        @PathVariable Long chatId,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("API GET /api/chats/{}/messages requested by user {}", chatId, currentUser.getId());
        return ResponseEntity.ok(chatService.getMessagesForChat(chatId, currentUser.getId()));
    }

    /**
     * Saves and broadcasts a message sent via HTTP POST.
     *
     * @param chatId         The ID of the chat to send the message to.
     * @param messagePayload DTO containing the message content.
     * @param currentUser    The authenticated sender.
     * @return The saved ChatMessageDto.
     */
    @PostMapping("/{chatId}/messages")
    public ResponseEntity<ChatMessageDto> sendChatMessage(
        @PathVariable Long chatId,
        @Valid @RequestBody SendMessageRequestDto messagePayload, // Use a simple DTO for content
        @AuthenticationPrincipal UserDetailsImpl currentUser) {

        log.debug("API POST /api/chats/{}/messages received from user {}: {}", chatId, currentUser.getId(), messagePayload.getContent());

        ChatMessageDto messageDto = new ChatMessageDto();
        messageDto.setChatId(chatId);
        messageDto.setContent(messagePayload.getContent());

        ChatMessageDto savedMessage = chatService.saveAndBroadcastMessage(messageDto, currentUser.getId());
        return ResponseEntity.ok(savedMessage);
    }

    /**
     * Marks messages in a chat as read for the current user.
     *
     * @param chatId      The ID of the chat where messages should be marked read.
     * @param currentUser The authenticated user whose messages are being marked read.
     * @return ResponseEntity with No Content status.
     */
    @PostMapping("/{chatId}/read")
    public ResponseEntity<Void> markChatRead(
        @PathVariable Long chatId,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {

        log.debug("API POST /api/chats/{}/read received from user {}", chatId, currentUser.getId());
        chatService.markMessagesAsRead(chatId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

}

@lombok.Data
class SendMessageRequestDto {
    @jakarta.validation.constraints.NotBlank(message = "Message content cannot be empty")
    private String content;
}
