package com.studybuddy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_user_one_id")
    private Long matchUserOneId;

    @Column(name = "match_user_two_id")
    private Long matchUserTwoId;
    
    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
    }
    
    // Helper method to check if a user is part of this chat
    public boolean hasParticipant(Long userId) {
        return userId.equals(matchUserOneId) || userId.equals(matchUserTwoId);
    }
    
    // Helper method to get the other user ID
    public Long getOtherParticipantId(Long currentUserId) {
        if (currentUserId.equals(matchUserOneId)) {
            return matchUserTwoId;
        } else if (currentUserId.equals(matchUserTwoId)) {
            return matchUserOneId;
        }
        throw new IllegalArgumentException("User ID is not a participant in this chat");
    }
}
