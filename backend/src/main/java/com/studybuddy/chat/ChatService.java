package com.studybuddy.chat;

import com.studybuddy.chat.dto.ChatInfoDto;
import com.studybuddy.chat.dto.ChatMessageDto;
import com.studybuddy.chat.dto.ReadReceiptDto;
import com.studybuddy.exception.AuthException;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.model.Chat;
import com.studybuddy.model.Message;
import com.studybuddy.model.User;
import com.studybuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ChatInfoDto> getChatsForUser(Long userId) {
        log.debug("Fetching chats for user ID: {}", userId);
        List<Chat> chats = chatRepository.findChatsByUserId(userId);
        log.debug("Found {} raw chat entries for user ID: {}", chats.size(), userId);
        List<ChatInfoDto> chatInfoDtos = new ArrayList<>();

        if (chats.isEmpty()) {
            log.info("No chats found for user ID: {}", userId);
            return chatInfoDtos;
        }

        Set<Long> otherUserIds = new HashSet<>();
        for (Chat chat : chats) {
            try {
                otherUserIds.add(chat.getOtherParticipantId(userId));
            } catch (IllegalArgumentException e) {
                log.warn("User {} is not a participant in chat {} but it was fetched. Skipping.", userId, chat.getId());
            }
        }
        if (otherUserIds.isEmpty() && !chats.isEmpty()) {
            log.warn("No valid other user IDs found for user {} despite {} chats being fetched.", userId, chats.size());
            return chatInfoDtos;
        }
        log.debug("Fetching details for other user IDs: {}", otherUserIds);


        Map<Long, User> otherUsersMap = new HashMap<>();
        if (!otherUserIds.isEmpty()) {
            otherUsersMap.putAll(userRepository.findAllById(otherUserIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user)));
            log.debug("Fetched {} other users' details", otherUsersMap.size());
        }


        for (Chat chat : chats) {
            Long otherUserId = null;
            try {
                otherUserId = chat.getOtherParticipantId(userId);
            } catch (IllegalArgumentException e) {
                continue;
            }

            User otherUser = otherUsersMap.get(otherUserId);
            if (otherUser == null) {
                log.warn("Could not find other user details for ID {} in chat {}. Creating placeholder.", otherUserId, chat.getId());
                otherUser = new User();
                otherUser.setId(otherUserId);
                otherUser.setFullName("Unknown User [" + otherUserId + "]");
                otherUser.setProfilePictureUrl(null);
            }

            Optional<Message> latestMessageOpt = messageRepository.findTopByChatIdOrderByTimestampDesc(chat.getId());

            String lastMessageContent = "No messages yet.";
            ZonedDateTime lastMessageTimestamp = chat.getCreatedAt();

            if (latestMessageOpt.isPresent()) {
                Message lastMessage = latestMessageOpt.get();
                lastMessageContent = lastMessage.getContent();
                lastMessageTimestamp = lastMessage.getTimestamp();
                log.trace("Chat {}: Last message found (ID: {}, Time: {})", chat.getId(), lastMessage.getId(), lastMessageTimestamp);
            } else {
                log.trace("Chat {}: No messages found, using creation time: {}", chat.getId(), lastMessageTimestamp);
            }


            ChatInfoDto chatInfoDto = new ChatInfoDto(
                chat.getId(),
                otherUser.getId(),
                otherUser.getFullName(),
                otherUser.getProfilePictureUrl(),
                lastMessageContent,
                lastMessageTimestamp
            );
            log.trace("Created ChatInfoDto for chat {}: {}", chat.getId(), chatInfoDto);
            chatInfoDtos.add(chatInfoDto);
        }

        if (chatInfoDtos.isEmpty() && !chats.isEmpty()) {
            log.warn("Processed {} chats for user {} but ended up with 0 valid ChatInfo DTOs.", chats.size(), userId);
        }


        chatInfoDtos.sort(Comparator.comparing(
            ChatInfoDto::getLastMessageTimestamp,
            Comparator.nullsLast(Comparator.reverseOrder())
        ));

        log.info("Returning {} sorted chat info DTOs for user ID: {}", chatInfoDtos.size(), userId);
        return chatInfoDtos;
    }


    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesForChat(Long chatId, Long userId) {
        log.debug("Fetching messages for chat ID: {} by user ID: {}", chatId, userId);
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        if (!chat.hasParticipant(userId)) {
            log.warn("Auth failed: User {} attempted to access chat {} without being a participant.", userId, chatId);
            throw new AuthException("You are not authorized to view this chat");
        }

        List<Message> messages = messageRepository.findByChatIdOrderByTimestampAsc(chatId);

        List<ChatMessageDto> messageDtos = messages.stream().map(message -> {
            User sender = message.getSender();
            return new ChatMessageDto(
                message.getId(),
                chat.getId(),
                sender.getId(),
                sender.getFullName(),
                message.getContent(),
                message.getTimestamp(),
                message.getReadTimestamp()
            );
        }).collect(Collectors.toList());


        log.info("Returning {} messages for chat ID: {}", messageDtos.size(), chatId);
        return messageDtos;
    }


    @Transactional
    public ChatMessageDto saveAndBroadcastMessage(ChatMessageDto messageDto, Long senderId) {
        log.debug("Attempting to save and broadcast message for chat ID: {} from sender ID: {}", messageDto.getChatId(), senderId);

        Chat chat = chatRepository.findById(messageDto.getChatId())
            .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", messageDto.getChatId()));

        if (!chat.hasParticipant(senderId)) {
            log.warn("Auth failed: User {} attempted to send message to chat {} without being a participant.", senderId, chat.getId());
            throw new AuthException("You are not authorized to send messages in this chat");
        }

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(messageDto.getContent());

        Message savedMessage = messageRepository.save(message);
        log.info("Message saved with ID: {}", savedMessage.getId());

        ChatMessageDto savedMessageDto = new ChatMessageDto(
            savedMessage.getId(),
            chat.getId(),
            sender.getId(),
            sender.getFullName(),
            savedMessage.getContent(),
            savedMessage.getTimestamp(),
            savedMessage.getReadTimestamp()
        );

        String destination = "/topic/chats/" + chat.getId();
        log.debug("Broadcasting message to WebSocket destination {}: {}", destination, savedMessageDto);
        messagingTemplate.convertAndSend(destination, savedMessageDto);

        return savedMessageDto;
    }

    @Transactional
    public void markMessagesAsRead(Long chatId, Long readerId) {
        log.debug("Attempting to mark messages as read for chat ID: {} by reader ID: {}", chatId, readerId);
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));
        if (!chat.hasParticipant(readerId)) {
            log.warn("Auth failed: User {} attempted to mark messages read for chat {} without being a participant.", readerId, chatId);
            throw new AuthException("You are not authorized to mark messages as read in this chat");
        }

        List<Message> unreadMessages = messageRepository.findUnreadMessagesForRecipient(chatId, readerId);

        if (unreadMessages.isEmpty()) {
            log.debug("No unread messages found for reader {} in chat {}", readerId, chatId);
            return;
        }

        List<Long> messageIdsToUpdate = unreadMessages.stream().map(Message::getId).collect(Collectors.toList());
        ZonedDateTime readTime = ZonedDateTime.now();

        log.debug("Found {} unread messages with IDs: {}. Marking as read at {}", unreadMessages.size(), messageIdsToUpdate, readTime);

        int updatedCount = messageRepository.markMessagesAsRead(messageIdsToUpdate, readTime);
        log.info("Marked {} messages as read for reader {} in chat {}", updatedCount, readerId, chatId);

        for (Message message : unreadMessages) {
            if (messageIdsToUpdate.contains(message.getId())) {
                Long senderId = message.getSender().getId();
                if (!senderId.equals(readerId)) {
                    String userDestination = "/user/" + senderId + "/queue/readReceipts";
                    ReadReceiptDto receipt = new ReadReceiptDto(message.getId(), chatId, readTime);
                    log.debug("Sending read receipt to {}: {}", userDestination, receipt);
                    // *** FIX THE METHOD NAME HERE ***
                    messagingTemplate.convertAndSendToUser(senderId.toString(), "/queue/readReceipts", receipt);
                }
            }
        }
    }
}
