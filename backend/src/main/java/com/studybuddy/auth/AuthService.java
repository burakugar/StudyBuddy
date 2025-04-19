package com.studybuddy.auth;

import com.studybuddy.auth.dto.JwtResponse;
import com.studybuddy.auth.dto.LoginRequest;
import com.studybuddy.auth.dto.SignupRequest;
import com.studybuddy.course.CourseRepository;
import com.studybuddy.exception.AuthException;
import com.studybuddy.interest.InterestRepository;
import com.studybuddy.model.*;
import com.studybuddy.security.JwtUtils;
import com.studybuddy.security.UserDetailsImpl;
import com.studybuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final InterestRepository interestRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * Register a new user and authenticate them
     */
    @Transactional
    public JwtResponse registerUser(SignupRequest signupRequest) {
        // Check if email already exists
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new AuthException("Email is already in use");
        }

        // Create new user
        User user = new User();
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setFullName(signupRequest.getFullName());
        user.setAcademicYear(signupRequest.getAcademicYear());
        user.setMajor(signupRequest.getMajor());
        user.setUniversity(signupRequest.getUniversity());
        user.setBio(signupRequest.getBio());
        user.setStudyStyle(signupRequest.getStudyStyle());
        user.setPreferredEnvironment(signupRequest.getPreferredEnvironment());
        user.setProfilePictureUrl(signupRequest.getProfilePictureUrl());

        // Save user first to get ID
        User savedUser = userRepository.save(user);

        // Handle courses
        Set<UserCourse> userCourses = new HashSet<>();
        if (signupRequest.getCourseCodes() != null && !signupRequest.getCourseCodes().isEmpty()) {
            Set<Course> courses = courseRepository.findByCourseCodeIn(signupRequest.getCourseCodes());

            // Add existing courses
            for (Course course : courses) {
                userCourses.add(new UserCourse(savedUser, course));
            }

            // Create and add any new courses
            Set<String> existingCourseCodes = new HashSet<>();
            courses.forEach(course -> existingCourseCodes.add(course.getCourseCode()));

            for (String courseCode : signupRequest.getCourseCodes()) {
                if (!existingCourseCodes.contains(courseCode)) {
                    Course newCourse = new Course();
                    newCourse.setCourseCode(courseCode);
                    newCourse.setName(courseCode); // Default name to code if not provided
                    Course savedCourse = courseRepository.save(newCourse);
                    userCourses.add(new UserCourse(savedUser, savedCourse));
                }
            }
        }
        savedUser.setCourses(userCourses);

        // Handle interests
        Set<UserInterest> userInterests = new HashSet<>();
        if (signupRequest.getInterestNames() != null && !signupRequest.getInterestNames().isEmpty()) {
            Set<Interest> interests = interestRepository.findByNameIn(signupRequest.getInterestNames());

            // Add existing interests
            for (Interest interest : interests) {
                userInterests.add(new UserInterest(savedUser, interest));
            }

            // Create and add any new interests
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

        // Save user with all relationships
        userRepository.save(savedUser);

        // Authenticate the new user
        return authenticateUser(new LoginRequest(signupRequest.getEmail(), signupRequest.getPassword()));
    }

    /**
     * Authenticate user and generate JWT
     */
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        // Set authentication in security context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate JWT token
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Get user details
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFullName()
        );
    }
}
