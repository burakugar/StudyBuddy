package com.studybuddy.sessions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudySessionDto {
    private Long id;
    private String title;
    private String description;
    private ZonedDateTime startTime;
    private ZonedDateTime endTime;
    private String location;
    private Long creatorId;
    private String creatorName;
    private String courseCode;
    private List<Long> participantIds;
    private int participantCount;
}
