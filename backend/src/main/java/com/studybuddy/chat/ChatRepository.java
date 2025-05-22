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

    @Query("SELECT c FROM Chat c WHERE (c.matchUserOneId = :userOneId AND c.matchUserTwoId = :userTwoId) OR (c.matchUserOneId = :userTwoId AND c.matchUserTwoId = :userOneId)")
    Optional<Chat> findChatByParticipantIds(@Param("userOneId") Long userOneId, @Param("userTwoId") Long userTwoId);


    @Query("SELECT c FROM Chat c WHERE c.matchUserOneId = :userId OR c.matchUserTwoId = :userId")
    List<Chat> findChatsByUserId(@Param("userId") Long userId);
}
