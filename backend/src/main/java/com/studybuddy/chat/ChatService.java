    package com.studybuddy.chat;

import com.studybuddy.chat.dto.ChatInfoDto;
import com.studybuddy.chat.dto.ChatMessageDto;
import com.studybuddy.exception.AuthException;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.model.Chat;
import com.studybuddy.model.Message;
import com.studybuddy.model.User;
import com.studybuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // Import Slf4j for logging
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional; // Add this import
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j // Add logging
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all chats for a user, optimized and more robust.
     */
    public List<ChatInfoDto> getChatsForUser(Long userId) {
        List<Chat> chats = chatRepository.findChatsByUserId(userId);
        List<ChatInfoDto> chatInfoDtos = new ArrayList<>();

        for (Chat chat : chats) {
            Long otherUserId = null;
            try {
                otherUserId = chat.getOtherParticipantId(userId);
            } catch (IllegalArgumentException e) {
                log.warn("User {} is not a participant in chat {} but it was fetched for them. Skipping.", userId, chat.getId());
                continue; // Skip this chat if the current user isn't actually part of it (data inconsistency)
            }

            // FIX: Fetch other user more gracefully
            Optional<User> otherUserOpt = userRepository.findById(otherUserId);
            User otherUser;
            if (otherUserOpt.isPresent()) {
                otherUser = otherUserOpt.get();
            } else {
                log.warn("Could not find other user with ID {} for chat {}. Using placeholder data.", otherUserId, chat.getId());
                // Optionally skip this chat instead: continue;
                // Or provide placeholder data:
                otherUser = new User(); // Create a dummy user
                otherUser.setId(otherUserId);
                otherUser.setFullName("Unknown User");
                otherUser.setProfilePictureUrl(null); // Or a default avatar URL
            }


            // FIX: Find the latest message efficiently using the new repository method
            Optional<Message> latestMessageOpt = messageRepository.findTopByChatIdOrderByTimestampDesc(chat.getId());

            String lastMessageContent = "";
            ZonedDateTime lastMessageTimestamp = chat.getCreatedAt(); // Default to chat creation time if no messages

            if (latestMessageOpt.isPresent()) {
                Message lastMessage = latestMessageOpt.get();
                lastMessageContent = lastMessage.getContent();
                lastMessageTimestamp = lastMessage.getTimestamp();
            }

            // Create chat info DTO
            ChatInfoDto chatInfoDto = new ChatInfoDto(
                chat.getId(),
                otherUser.getId(),
                otherUser.getFullName(),
                otherUser.getProfilePictureUrl(),
                lastMessageContent,
                lastMessageTimestamp // Use the determined timestamp
            );

            chatInfoDtos.add(chatInfoDto);
        }

        // Sort chats by latest message timestamp (most recent first)
        // Using chat creation time as a fallback for sorting ensures chats without messages also appear
        chatInfoDtos.sort(Comparator.comparing(
            ChatInfoDto::getLastMessageTimestamp, // Reference the getter directly
            Comparator.nullsLast(Comparator.reverseOrder()) // Handle potential nulls, sort newest first
        ));

        return chatInfoDtos;
    }

    /**
     * Get all messages for a specific chat
     */
    public List<ChatMessageDto> getMessagesForChat(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        // Verify the user is a participant in this chat
        if (!chat.hasParticipant(userId)) {
            throw new AuthException("You are not authorized to view this chat");
        }

        // Get messages
        List<Message> messages = messageRepository.findByChatIdOrderByTimestampAsc(chatId);

        // Map to DTOs
        return messages.stream().map(message -> new ChatMessageDto(
            message.getId(),
            chat.getId(),
            message.getSender().getId(),
            message.getSender().getFullName(),
            message.getContent(),
            message.getTimestamp()
        )).collect(Collectors.toList());
    }

    /**
     * Save a new message and broadcast it to chat participants
     */
    @Transactional
    public ChatMessageDto saveAndBroadcastMessage(ChatMessageDto messageDto, Long senderId) {
        // Find chat
        Chat chat = chatRepository.findById(messageDto.getChatId())
            .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", messageDto.getChatId()));

        // Verify sender is part of this chat
        if (!chat.hasParticipant(senderId)) {
            throw new AuthException("You are not authorized to send messages in this chat");
        }

        // Find sender
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        // Create and save message
        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(messageDto.getContent());
        message.setTimestamp(ZonedDateTime.now()); // Ensure timestamp is set

        Message savedMessage = messageRepository.save(message);

        // Create DTO for response
        ChatMessageDto savedMessageDto = new ChatMessageDto(
            savedMessage.getId(),
            chat.getId(),
            sender.getId(),
            sender.getFullName(),
            savedMessage.getContent(),
            savedMessage.getTimestamp()
        );

        // Broadcast to subscribers
        String destination = "/topic/chats/" + chat.getId();
        log.debug("Broadcasting message to {}: {}", destination, savedMessageDto);
        messagingTemplate.convertAndSend(destination, savedMessageDto);

        return savedMessageDto;
    }
}
