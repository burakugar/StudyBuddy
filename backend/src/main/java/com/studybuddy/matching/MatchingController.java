package com.studybuddy.matching;

import com.studybuddy.matching.dto.MatchActionRequest;
import com.studybuddy.matching.dto.MatchCardDto;
import com.studybuddy.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus; // Import HttpStatus
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map; // Using Map for the empty JSON response

@RestController
@RequestMapping("/api/matches") // Plural "matches"
@RequiredArgsConstructor
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;

    /**
     * Get potential study buddy matches (quick match)
     */
    @GetMapping("/quick")
    public ResponseEntity<List<MatchCardDto>> getPotentialMatches(
        @AuthenticationPrincipal UserDetailsImpl currentUser,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {

        if (currentUser == null) {
            log.warn("Unauthorized attempt to get potential matches.");
            // Return 401 Unauthorized if user details are missing
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.debug("Fetching potential matches for user {} with page={}, size={}", currentUser.getId(), page, size);
        Pageable pageable = PageRequest.of(page, size);
        List<MatchCardDto> matches = matchingService.getPotentialMatches(currentUser.getId(), pageable);
        return ResponseEntity.ok(matches);
    }

    /**
     * Accept or reject a potential match
     */
    @PostMapping("/quick/{targetUserId}")
    // Return type changed to ResponseEntity<Map<String, Object>> for empty JSON
    public ResponseEntity<Map<String, Object>> processMatchAction(
        @AuthenticationPrincipal UserDetailsImpl currentUser,
        @PathVariable Long targetUserId,
        @Valid @RequestBody MatchActionRequest actionRequest) {

        if (currentUser == null) {
            log.warn("Unauthorized attempt to process match action.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("Processing match action '{}' from user {} towards user {}",
            actionRequest.getAction(), currentUser.getId(), targetUserId);

        matchingService.processMatchAction(currentUser.getId(), targetUserId, actionRequest.getAction());

        // Return 200 OK with an empty JSON object body '{}'
        // This satisfies the default Angular HttpClient expectation for JSON
        log.debug("Match action processed successfully for user {} and {}", currentUser.getId(), targetUserId);
        return ResponseEntity.ok(Collections.emptyMap());
    }
}
