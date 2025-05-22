package com.studybuddy.auth;

import com.studybuddy.auth.dto.ForgotPasswordRequest;
import com.studybuddy.auth.dto.JwtResponse;
import com.studybuddy.auth.dto.LoginRequest;
import com.studybuddy.auth.dto.ResetPasswordRequest;
import com.studybuddy.auth.dto.SignupRequest;
import com.studybuddy.exception.AuthException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<JwtResponse> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        return ResponseEntity.ok(authService.registerUser(signupRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotRequest) {
        log.debug("Received forgot password request for email: {}", forgotRequest.getEmail());
        try {
            authService.requestPasswordReset(forgotRequest);
            return ResponseEntity.accepted().body("Password reset email requested.");
        } catch (Exception e) {
            log.error("Unexpected error during password reset request for {}: {}", forgotRequest.getEmail(), e.getMessage());
            return ResponseEntity.accepted().body("Password reset email requested.");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest resetRequest) {
        log.debug("Received reset password request with token: {}", resetRequest.getToken());
        try {
            authService.resetPassword(resetRequest);
            return ResponseEntity.ok("Password reset successfully.");
        } catch (AuthException e) {
            log.warn("Password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during password reset for token {}: {}", resetRequest.getToken(), e.getMessage());
            return ResponseEntity.internalServerError().body("An error occurred while resetting the password.");
        }
    }
}
