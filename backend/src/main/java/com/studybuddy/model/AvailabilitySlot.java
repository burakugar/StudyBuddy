package com.studybuddy.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Objects;

@Entity
@Table(name = "availability_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Day of week is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    @Column(nullable = false)
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    @Column(nullable = false)
    private LocalTime endTime;

    @PrePersist
    @PreUpdate
    public void validateTimeRange() {
        if (startTime != null && endTime != null && !startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("End time must be after start time");
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
        AvailabilitySlot that = (AvailabilitySlot) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AvailabilitySlot{" +
            "id=" + id +
            ", userId=" + (user != null ? user.getId() : null) +
            ", dayOfWeek=" + dayOfWeek +
            ", startTime=" + startTime +
            ", endTime=" + endTime +
            '}';
    }
}
