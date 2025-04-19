package com.studybuddy.matching.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchActionRequest {

    @NotBlank(message = "Action is required")
    @Pattern(regexp = "^(ACCEPTED|REJECTED)$", message = "Action must be either ACCEPTED or REJECTED")
    private String action;
}
