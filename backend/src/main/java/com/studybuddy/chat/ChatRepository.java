package com.studybuddy.chat;

import com.studybuddy.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    
    /**
     * Find a chat by the match user IDs
     */
    Optional<Chat> findByMatchUserOneIdAndMatchUserTwoId(Long userOneId, Long userTwoId);
    
    /**
     * Find all chats for a specific user
     */
    @Query("SELECT c FROM Chat c WHERE c.matchUserOneId = :userId OR c.matchUserTwoId = :userId")
    List<Chat> findChatsByUserId(@Param("userId") Long userId);
}
