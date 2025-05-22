package com.studybuddy.sessions.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudySessionDto {

    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Future(message = "Start time must be in the future")
    private ZonedDateTime startTime;

    private ZonedDateTime endTime;

    @Size(max = 255, message = "Location cannot exceed 255 characters")
    private String location;

    private String courseCode;
}
