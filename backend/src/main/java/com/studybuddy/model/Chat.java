package com.studybuddy.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "chats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_user_one_id", nullable = false)
    private Long matchUserOneId;

    @Column(name = "match_user_two_id", nullable = false)
    private Long matchUserTwoId;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Message> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
    }

    public boolean hasParticipant(Long userId) {
        return userId != null && (userId.equals(matchUserOneId) || userId.equals(matchUserTwoId));
    }

    public Long getOtherParticipantId(Long currentUserId) {
        if (currentUserId == null) {
            throw new IllegalArgumentException("Current User ID cannot be null");
        }
        if (currentUserId.equals(matchUserOneId)) {
            return matchUserTwoId;
        } else if (currentUserId.equals(matchUserTwoId)) {
            return matchUserOneId;
        }
        throw new IllegalArgumentException(
            "User ID " + currentUserId + " is not a participant in this chat (IDs: " + matchUserOneId + ", " + matchUserTwoId + ")");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Chat chat = (Chat) o;
        return Objects.equals(id, chat.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Chat{" +
            "id=" + id +
            ", matchUserOneId=" + matchUserOneId +
            ", matchUserTwoId=" + matchUserTwoId +
            ", createdAt=" + createdAt +
            '}';
    }
}
