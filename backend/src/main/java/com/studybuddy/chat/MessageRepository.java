package com.studybuddy.chat;

import com.studybuddy.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChatIdOrderByTimestampAsc(Long chatId);

    Optional<Message> findTopByChatIdOrderByTimestampDesc(Long chatId);

    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.sender.id != :recipientId AND m.readTimestamp IS NULL")
    List<Message> findUnreadMessagesForRecipient(@Param("chatId") Long chatId, @Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE Message m SET m.readTimestamp = :readTime WHERE m.id IN :messageIds AND m.readTimestamp IS NULL")
    int markMessagesAsRead(@Param("messageIds") List<Long> messageIds, @Param("readTime") ZonedDateTime readTime);

}
