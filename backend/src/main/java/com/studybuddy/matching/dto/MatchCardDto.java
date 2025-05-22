package com.studybuddy.matching.dto;

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
public class MatchCardDto {

    private Long userId;
    private String fullName;
    private String academicYear;
    private String major;
    private String profilePictureUrl;
    private List<CourseDto> commonCourses = new ArrayList<>();
    private List<InterestDto> commonInterests = new ArrayList<>();
    private String bio;
    private double availabilityScore; // Added score
}
