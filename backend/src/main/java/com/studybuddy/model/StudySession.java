package com.studybuddy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private ZonedDateTime startTime;

    @Column
    private ZonedDateTime endTime;

    @Column(nullable = false, length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "study_session_participants",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        ZonedDateTime now = ZonedDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.creator != null) {
            this.participants.add(this.creator);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        StudySession that = (StudySession) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "StudySession{" +
            "id=" + id +
            ", title='" + title + '\'' +
            ", startTime=" + startTime +
            ", creatorId=" + (creator != null ? creator.getId() : null) +
            ", participantCount=" + (participants != null ? participants.size() : 0) +
            '}';
    }
}
