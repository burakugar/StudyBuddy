package com.studybuddy.chat;

import com.studybuddy.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Find all messages for a specific chat ordered by timestamp
     */
    List<Message> findByChatIdOrderByTimestampAsc(Long chatId);

    /**
     * Find the most recent message for a specific chat.
     * Returns an Optional<Message>.
     */
    Optional<Message> findTopByChatIdOrderByTimestampDesc(Long chatId); // Add this method
}
