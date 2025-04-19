package com.studybuddy.user;

import com.studybuddy.security.UserDetailsImpl;
import com.studybuddy.user.dto.PublicProfileDto;
import com.studybuddy.user.dto.UserProfileDto;
import com.studybuddy.user.dto.UserUpdateDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get the current authenticated user's profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(userService.getUserProfile(currentUser.getId()));
    }

    /**
     * Update the current authenticated user's profile
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateCurrentUserProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody UserUpdateDto updateDto) {
        return ResponseEntity.ok(userService.updateUserProfile(currentUser.getId(), updateDto));
    }

    /**
     * Get public profile for any user
     */
    @GetMapping("/{userId}/public")
    public ResponseEntity<PublicProfileDto> getPublicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }
}
