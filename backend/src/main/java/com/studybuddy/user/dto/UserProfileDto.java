package com.studybuddy.user.dto;

import com.studybuddy.course.dto.CourseDto;
import com.studybuddy.interest.dto.InterestDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    
    private Long id;
    private String email;
    private String fullName;
    private String academicYear;
    private String profilePictureUrl;
    private String major;
    private String university;
    private String bio;
    private String studyStyle;
    private String preferredEnvironment;
    private List<CourseDto> courses = new ArrayList<>();
    private List<InterestDto> interests = new ArrayList<>();
}
