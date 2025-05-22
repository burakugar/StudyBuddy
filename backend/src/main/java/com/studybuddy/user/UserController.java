package com.studybuddy.user;

import com.studybuddy.security.UserDetailsImpl;
import com.studybuddy.user.dto.NearbyUserDto; // Import DTO
import com.studybuddy.user.dto.PublicProfileDto;
import com.studybuddy.user.dto.UserProfileDto;
import com.studybuddy.user.dto.UserUpdateDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List; // Import List

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getUserProfile(currentUser.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateCurrentUserProfile(
        @AuthenticationPrincipal UserDetailsImpl currentUser,
        @Valid @RequestBody UserUpdateDto updateDto) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.updateUserProfile(currentUser.getId(), updateDto));
    }

    @GetMapping("/{userId}/public")
    public ResponseEntity<PublicProfileDto> getPublicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyUserDto>> getNearbyUsers(
        @AuthenticationPrincipal UserDetailsImpl currentUser,
        @RequestParam(defaultValue = "5.0") double radiusKm, // Default radius 5km
        @RequestParam(defaultValue = "20") int limit) {      // Default limit 20 users
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<NearbyUserDto> nearbyUsers = userService.findNearbyUsers(currentUser.getId(), radiusKm, limit);
        return ResponseEntity.ok(nearbyUsers);
    }
}
