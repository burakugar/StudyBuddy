package com.studybuddy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "user_courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCourse {

    @EmbeddedId
    private UserCourseId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("courseId")
    private Course course;

    // Constructor for easier creation
    public UserCourse(User user, Course course) {
        this.user = user;
        this.course = course;
        this.id = new UserCourseId(user.getId(), course.getId());
    }
}

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
class UserCourseId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "course_id")
    private Integer courseId;
}
