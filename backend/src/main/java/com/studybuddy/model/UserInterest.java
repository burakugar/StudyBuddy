package com.studybuddy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "user_interests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserInterest {

    @EmbeddedId
    private UserInterestId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("interestId")
    private Interest interest;

    public UserInterest(User user, Interest interest) {
        this.user = user;
        this.interest = interest;
        this.id = new UserInterestId(user.getId(), interest.getId());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UserInterest that = (UserInterest) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "UserInterest{" +
            "id=" + id +
            '}';
    }
}

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class UserInterestId implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "interest_id")
    private Integer interestId;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UserInterestId that = (UserInterestId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(interestId, that.interestId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, interestId);
    }

    @Override
    public String toString() {
        return "UserInterestId{" +
            "userId=" + userId +
            ", interestId=" + interestId +
            '}';
    }
}
