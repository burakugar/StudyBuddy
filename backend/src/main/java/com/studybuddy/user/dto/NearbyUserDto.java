package com.studybuddy.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NearbyUserDto {
    private Long userId;
    private String fullName;
    private String profilePictureUrl;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;
}
