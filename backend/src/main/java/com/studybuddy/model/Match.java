package com.studybuddy.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.Objects;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @EmbeddedId
    private MatchId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userOneId")
    @JoinColumn(name = "user_one_id", nullable = false)
    private User userOne;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userTwoId")
    @JoinColumn(name = "user_two_id", nullable = false)
    private User userTwo;

    @Column(name = "user_one_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private MatchStatus userOneStatus = MatchStatus.PENDING;

    @Column(name = "user_two_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private MatchStatus userTwoStatus = MatchStatus.PENDING;

    @Column(name = "status", insertable = false, updatable = false)
    private String status;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        ZonedDateTime now = ZonedDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.id == null && userOne != null && userTwo != null) {
            this.id = MatchId.create(userOne.getId(), userTwo.getId());
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    public void setUserStatus(Long userId, MatchStatus status) {
        if (userId == null || this.id == null) {
            throw new IllegalArgumentException("User ID and Match ID cannot be null");
        }
        if (userId.equals(id.getUserOneId())) {
            this.userOneStatus = status;
        } else if (userId.equals(id.getUserTwoId())) {
            this.userTwoStatus = status;
        } else {
            throw new IllegalArgumentException(
                "User ID " + userId + " does not match either user in this match (IDs: " + id.getUserOneId() + ", " + id.getUserTwoId() + ")");
        }
    }

    public String calculateStatus() {
        if (userOneStatus == MatchStatus.ACCEPTED && userTwoStatus == MatchStatus.ACCEPTED) {
            return "MATCHED";
        } else if (userOneStatus == MatchStatus.REJECTED || userTwoStatus == MatchStatus.REJECTED) {
            return "REJECTED";
        } else {
            return "PENDING";
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
        Match match = (Match) o;
        return Objects.equals(id, match.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Match{" +
            "id=" + id +
            ", userOneStatus=" + userOneStatus +
            ", userTwoStatus=" + userTwoStatus +
            ", status='" + status + '\'' +
            ", createdAt=" + createdAt +
            ", updatedAt=" + updatedAt +
            '}';
    }
}
