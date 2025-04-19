package com.studybuddy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchId implements Serializable {

    @Column(name = "user_one_id")
    private Long userOneId;

    @Column(name = "user_two_id")
    private Long userTwoId;

    // Factory method to ensure userOneId < userTwoId
    public static MatchId create(Long user1Id, Long user2Id) {
        if (user1Id < user2Id) {
            return new MatchId(user1Id, user2Id);
        } else {
            return new MatchId(user2Id, user1Id);
        }
    }
}
