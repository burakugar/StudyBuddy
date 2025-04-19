package com.studybuddy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.ZonedDateTime;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @EmbeddedId
    private MatchId id;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("userOneId")
    @JoinColumn(name = "user_one_id")
    private User userOne;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("userTwoId")
    @JoinColumn(name = "user_two_id")
    private User userTwo;

    @Column(name = "user_one_status")
    @Enumerated(EnumType.STRING)
    private MatchStatus userOneStatus = MatchStatus.PENDING;

    @Column(name = "user_two_status")
    @Enumerated(EnumType.STRING)
    private MatchStatus userTwoStatus = MatchStatus.PENDING;

    @Column
    private String status; // This is a database-generated field

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        this.updatedAt = ZonedDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    // Helper methods to update status
    public void setUserStatus(Long userId, MatchStatus status) {
        if (userId.equals(id.getUserOneId())) {
            this.userOneStatus = status;
        } else if (userId.equals(id.getUserTwoId())) {
            this.userTwoStatus = status;
        } else {
            throw new IllegalArgumentException("User ID does not match either user in this match");
        }
    }
    
    // Calculate status (used when fetching from DB since status is computed by DB)
    public String calculateStatus() {
        if (userOneStatus == MatchStatus.ACCEPTED && userTwoStatus == MatchStatus.ACCEPTED) {
            return "MATCHED";
        } else if (userOneStatus == MatchStatus.REJECTED || userTwoStatus == MatchStatus.REJECTED) {
            return "REJECTED";
        } else {
            return "PENDING";
        }
    }
}

