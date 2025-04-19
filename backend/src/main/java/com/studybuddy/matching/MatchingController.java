package com.studybuddy.matching;

import com.studybuddy.matching.dto.MatchActionRequest;
import com.studybuddy.matching.dto.MatchCardDto;
import com.studybuddy.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// Add this import
import java.util.Collections;
import java.util.List;
import java.util.Map; // Can also use Map<String, Object> if preferred over raw Object

@RestController
@RequestMapping("/api/matches") // Plural "matches"
@RequiredArgsConstructor
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

        Pageable pageable = PageRequest.of(page, size);

        // Ensure currentUser is not null before accessing getId()
        if (currentUser == null) {
            // Or throw an appropriate exception / return an error response
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(matchingService.getPotentialMatches(currentUser.getId(), pageable));
    }

    /**
     * Accept or reject a potential match
     */
    @PostMapping("/quick/{targetUserId}")
    // Return type changed to ResponseEntity<Object> or ResponseEntity<Map<String, Object>>
    public ResponseEntity<Object> processMatchAction(
        @AuthenticationPrincipal UserDetailsImpl currentUser,
        @PathVariable Long targetUserId,
        @Valid @RequestBody MatchActionRequest actionRequest) {

        // Ensure currentUser is not null before accessing getId()
        if (currentUser == null) {
            // Or throw an appropriate exception / return an error response
            return ResponseEntity.status(401).build();
        }

        matchingService.processMatchAction(currentUser.getId(), targetUserId, actionRequest.getAction());

        // Return 200 OK with an empty JSON object body '{}'
        // This satisfies the default Angular HttpClient expectation
        return ResponseEntity.ok(Collections.emptyMap());
    }
}
