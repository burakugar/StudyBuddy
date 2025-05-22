package com.studybuddy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class MatchId implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @Column(name = "user_one_id", nullable = false)
    private Long userOneId;

    @Column(name = "user_two_id", nullable = false)
    private Long userTwoId;

    private MatchId(Long userOneId, Long userTwoId) {
        this.userOneId = userOneId;
        this.userTwoId = userTwoId;
    }

    public static MatchId create(Long user1Id, Long user2Id) {
        if (user1Id == null || user2Id == null) {
            throw new IllegalArgumentException("User IDs cannot be null");
        }
        if (user1Id.equals(user2Id)) {
            throw new IllegalArgumentException("User IDs cannot be the same for a match");
        }
        if (user1Id < user2Id) {
            return new MatchId(user1Id, user2Id);
        } else {
            return new MatchId(user2Id, user1Id);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        MatchId matchId = (MatchId) o;
        return (Objects.equals(userOneId, matchId.userOneId) && Objects.equals(userTwoId, matchId.userTwoId));
    }

    @Override
    public int hashCode() {
        return Objects.hash(userOneId, userTwoId);
    }

    @Override
    public String toString() {
        return "MatchId{" +
            "userOneId=" + userOneId +
            ", userTwoId=" + userTwoId +
            '}';
    }
}
