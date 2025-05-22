package com.studybuddy.auth;

import com.studybuddy.auth.dto.ForgotPasswordRequest;
import com.studybuddy.auth.dto.JwtResponse;
import com.studybuddy.auth.dto.LoginRequest;
import com.studybuddy.auth.dto.SignupRequest;
import com.studybuddy.auth.dto.ResetPasswordRequest;
import com.studybuddy.course.CourseRepository;
import com.studybuddy.exception.AuthException;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.interest.InterestRepository;
import com.studybuddy.model.*;
import com.studybuddy.security.JwtUtils;
import com.studybuddy.security.UserDetailsImpl;
import com.studybuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final InterestRepository interestRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.from:noreply@studybuddy.com}")
    private String fromEmail;

    @Transactional
    public JwtResponse registerUser(SignupRequest signupRequest) {
        String email = signupRequest.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthException("Email is already in use");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setFullName(signupRequest.getFullName());
        user.setAcademicYear(signupRequest.getAcademicYear());
        user.setMajor(signupRequest.getMajor());
        user.setUniversity(signupRequest.getUniversity());
        user.setBio(signupRequest.getBio());
        user.setStudyStyle(signupRequest.getStudyStyle());
        user.setPreferredEnvironment(signupRequest.getPreferredEnvironment());
        user.setProfilePictureUrl(signupRequest.getProfilePictureUrl());

        User savedUser = userRepository.save(user);

        Set<UserCourse> userCourses = new HashSet<>();
        if (signupRequest.getCourseCodes() != null && !signupRequest.getCourseCodes().isEmpty()) {
            Set<Course> courses = courseRepository.findByCourseCodeIn(signupRequest.getCourseCodes());

            for (Course course : courses) {
                userCourses.add(new UserCourse(savedUser, course));
            }

            Set<String> existingCourseCodes = new HashSet<>();
            courses.forEach(course -> existingCourseCodes.add(course.getCourseCode()));

            for (String courseCode : signupRequest.getCourseCodes()) {
                if (!existingCourseCodes.contains(courseCode)) {
                    Course newCourse = new Course();
                    newCourse.setCourseCode(courseCode);
                    newCourse.setName(courseCode);
                    Course savedCourse = courseRepository.save(newCourse);
                    userCourses.add(new UserCourse(savedUser, savedCourse));
                }
            }
        }
        savedUser.setCourses(userCourses);

        Set<UserInterest> userInterests = new HashSet<>();
        if (signupRequest.getInterestNames() != null && !signupRequest.getInterestNames().isEmpty()) {
            Set<Interest> interests = interestRepository.findByNameIn(signupRequest.getInterestNames());

            for (Interest interest : interests) {
                userInterests.add(new UserInterest(savedUser, interest));
            }

            Set<String> existingInterestNames = new HashSet<>();
            interests.forEach(interest -> existingInterestNames.add(interest.getName()));

            for (String interestName : signupRequest.getInterestNames()) {
                if (!existingInterestNames.contains(interestName)) {
                    Interest newInterest = new Interest();
                    newInterest.setName(interestName);
                    Interest savedInterest = interestRepository.save(newInterest);
                    userInterests.add(new UserInterest(savedUser, savedInterest));
                }
            }
        }
        savedUser.setInterests(userInterests);

        User finalUser = userRepository.save(savedUser);

        try {
            sendWelcomeEmail(finalUser.getEmail(), finalUser.getFullName());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", finalUser.getEmail(), e.getMessage());
        }

        return authenticateUser(new LoginRequest(finalUser.getEmail(), signupRequest.getPassword()));
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return new JwtResponse(
            jwt,
            userDetails.getId(),
            userDetails.getUsername(),
            userDetails.getFullName()
        );
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest forgotRequest) {
        String email = forgotRequest.getEmail().trim();
        log.info("Password reset requested for email: {}", email);

        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            log.debug("User found with ID: {} and email: '{}'", user.getId(), user.getEmail());

            passwordResetTokenRepository.deleteByUser(user);

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken(token, user);
            passwordResetTokenRepository.save(resetToken);
            log.debug("Password reset token created with expiry: {}", resetToken.getExpiryDate());

            sendPasswordResetEmail(user.getEmail(), token);

        } else {
            log.warn("Password reset requested for non-existent email: '{}'", email);

            Optional<User> exactMatch = userRepository.findByEmail(email);
            log.debug("Exact case match found: {}", exactMatch.isPresent());

            List<User> allUsers = userRepository.findAll();
            log.debug("Total users in database: {}", allUsers.size());
            if (!allUsers.isEmpty()) {
                log.debug("Sample emails in database:");
                allUsers.stream().limit(5).forEach(u ->
                    log.debug("  - User ID {}: '{}'", u.getId(), u.getEmail())
                );
            }
        }
    }

    private void sendPasswordResetEmail(String recipientEmail, String token) {
        String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;
        String subject = "StudyBuddy - Password Reset Request";
        String message = "You requested a password reset.\n\n" +
            "Click the link below to reset your password:\n" +
            resetUrl + "\n\n" +
            "If you didn't request this, please ignore this email.\n" +
            "This link will expire in 60 minutes.";

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipientEmail);
            email.setSubject(subject);
            email.setText(message);
            email.setFrom(fromEmail);
            mailSender.send(email);
            log.info("Password reset email sent successfully to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending password reset email to {}: {}", recipientEmail, e.getMessage());
            throw new AuthException("Failed to send password reset email. Please try again later.");
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest resetRequest) {
        log.info("Attempting to reset password with token: {}", resetRequest.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(resetRequest.getToken())
            .orElseThrow(() -> new AuthException("Invalid password reset token."));

        if (resetToken.isExpired()) {
            log.warn("Password reset token {} has expired.", resetRequest.getToken());
            // Use deleteByToken instead of delete
            passwordResetTokenRepository.deleteByToken(resetRequest.getToken());
            throw new AuthException("Password reset token has expired.");
        }

        User user = resetToken.getUser();
        if (user == null) {
            log.error("Password reset token {} is not associated with a user.", resetRequest.getToken());
            // Use deleteByToken instead of delete
            passwordResetTokenRepository.deleteByToken(resetRequest.getToken());
            throw new AuthException("Invalid password reset token.");
        }

        log.debug("Token valid for user ID: {}. Updating password.", user.getId());

        user.setPassword(passwordEncoder.encode(resetRequest.getNewPassword()));
        userRepository.save(user);
        log.info("Password updated successfully for user ID: {}", user.getId());

        // Use deleteByToken instead of delete
        passwordResetTokenRepository.deleteByToken(resetRequest.getToken());
        log.debug("Password reset token {} deleted.", resetRequest.getToken());
    }

    public void sendWelcomeEmail(String recipientEmail, String fullName) {
        String subject = "Welcome to StudyBuddy!";
        String message = String.format(
            "Hi %s,\n\n" +
                "Welcome to StudyBuddy! We're excited to have you join our community of learners.\n\n" +
                "You can now:\n" +
                "- Find study partners with similar interests\n" +
                "- Join study groups for your courses\n" +
                "- Connect with students from your university\n\n" +
                "Get started by visiting: %s\n\n" +
                "Happy studying!\n" +
                "The StudyBuddy Team",
            fullName, frontendUrl
        );

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipientEmail);
            email.setSubject(subject);
            email.setText(message);
            email.setFrom(fromEmail);
            mailSender.send(email);
            log.info("Welcome email sent successfully to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending welcome email to {}: {}", recipientEmail, e.getMessage());
        }
    }
}
