package com.studybuddy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "user_interests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInterest {

    @EmbeddedId
    private UserInterestId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("interestId")
    private Interest interest;

    // Constructor for easier creation
    public UserInterest(User user, Interest interest) {
        this.user = user;
        this.interest = interest;
        this.id = new UserInterestId(user.getId(), interest.getId());
    }
}

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
class UserInterestId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "interest_id")
    private Integer interestId;
}
