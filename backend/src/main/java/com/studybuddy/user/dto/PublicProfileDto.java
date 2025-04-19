package com.studybuddy.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicProfileDto {
    
    private Long id;
    private String fullName;
    private String academicYear;
    private String major;
    private String university;
    private String profilePictureUrl;
    private String bio;
    private String studyStyle;
    private String preferredEnvironment;
}
