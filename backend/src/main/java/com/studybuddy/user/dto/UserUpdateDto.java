package com.studybuddy.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDto {

    @Size(min = 2, max = 255, message = "Full name must be between 2 and 255 characters")
    private String fullName;

    private String academicYear;
    private String major;
    private String university;
    private String bio;
    private String studyStyle;
    private String preferredEnvironment;
    private String profilePictureUrl;

    private Double latitude;
    private Double longitude;

    private Set<String> courseCodes = new HashSet<>();
    private Set<String> interestNames = new HashSet<>();

    @Valid
    private List<AvailabilitySlotDto> availabilitySlots = new ArrayList<>();
}
