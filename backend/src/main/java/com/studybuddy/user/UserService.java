package com.studybuddy.user;

import com.studybuddy.course.CourseRepository;
import com.studybuddy.course.dto.CourseDto;
import com.studybuddy.exception.AuthException;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.interest.InterestRepository;
import com.studybuddy.interest.dto.InterestDto;
import com.studybuddy.model.*;
import com.studybuddy.user.dto.PublicProfileDto;
import com.studybuddy.user.dto.UserProfileDto;
import com.studybuddy.user.dto.UserUpdateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final InterestRepository interestRepository;

    /**
     * Get the complete profile for a user
     */
    public UserProfileDto getUserProfile(Long userId) {
        User user = findUserById(userId);
        return mapToUserProfileDto(user);
    }

    /**
     * Update a user's profile information
     */
    @Transactional
    public UserProfileDto updateUserProfile(Long userId, UserUpdateDto updateDto) {
        User user = findUserById(userId);
        
        // Update basic profile fields if provided
        if (updateDto.getFullName() != null) {
            user.setFullName(updateDto.getFullName());
        }
        if (updateDto.getAcademicYear() != null) {
            user.setAcademicYear(updateDto.getAcademicYear());
        }
        if (updateDto.getMajor() != null) {
            user.setMajor(updateDto.getMajor());
        }
        if (updateDto.getUniversity() != null) {
            user.setUniversity(updateDto.getUniversity());
        }
        if (updateDto.getBio() != null) {
            user.setBio(updateDto.getBio());
        }
        if (updateDto.getStudyStyle() != null) {
            user.setStudyStyle(updateDto.getStudyStyle());
        }
        if (updateDto.getPreferredEnvironment() != null) {
            user.setPreferredEnvironment(updateDto.getPreferredEnvironment());
        }
        if (updateDto.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(updateDto.getProfilePictureUrl());
        }
        
        // Update courses if provided
        if (updateDto.getCourseCodes() != null) {
            // Clear existing courses
            user.getCourses().clear();
            
            // Find existing courses
            Set<Course> existingCourses = courseRepository.findByCourseCodeIn(updateDto.getCourseCodes());
            Set<String> existingCourseCodes = existingCourses.stream()
                    .map(Course::getCourseCode)
                    .collect(Collectors.toSet());
            
            // Add existing courses to user
            for (Course course : existingCourses) {
                user.getCourses().add(new UserCourse(user, course));
            }
            
            // Create and add new courses
            for (String courseCode : updateDto.getCourseCodes()) {
                if (!existingCourseCodes.contains(courseCode)) {
                    Course newCourse = new Course();
                    newCourse.setCourseCode(courseCode);
                    newCourse.setName(courseCode); // Default name to code
                    Course savedCourse = courseRepository.save(newCourse);
                    user.getCourses().add(new UserCourse(user, savedCourse));
                }
            }
        }
        
        // Update interests if provided
        if (updateDto.getInterestNames() != null) {
            // Clear existing interests
            user.getInterests().clear();
            
            // Find existing interests
            Set<Interest> existingInterests = interestRepository.findByNameIn(updateDto.getInterestNames());
            Set<String> existingInterestNames = existingInterests.stream()
                    .map(Interest::getName)
                    .collect(Collectors.toSet());
            
            // Add existing interests to user
            for (Interest interest : existingInterests) {
                user.getInterests().add(new UserInterest(user, interest));
            }
            
            // Create and add new interests
            for (String interestName : updateDto.getInterestNames()) {
                if (!existingInterestNames.contains(interestName)) {
                    Interest newInterest = new Interest();
                    newInterest.setName(interestName);
                    Interest savedInterest = interestRepository.save(newInterest);
                    user.getInterests().add(new UserInterest(user, savedInterest));
                }
            }
        }
        
        // Save the updated user
        User savedUser = userRepository.save(user);
        
        return mapToUserProfileDto(savedUser);
    }

    /**
     * Get public profile info for a user
     */
    public PublicProfileDto getPublicProfile(Long userId) {
        User user = findUserById(userId);
        return mapToPublicProfileDto(user);
    }
    
    /**
     * Find a user by ID or throw exception if not found
     */
    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
    
    /**
     * Map User entity to UserProfileDto
     */
    private UserProfileDto mapToUserProfileDto(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setAcademicYear(user.getAcademicYear());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setMajor(user.getMajor());
        dto.setUniversity(user.getUniversity());
        dto.setBio(user.getBio());
        dto.setStudyStyle(user.getStudyStyle());
        dto.setPreferredEnvironment(user.getPreferredEnvironment());
        
        // Map courses
        dto.setCourses(user.getCourses().stream()
                .map(userCourse -> new CourseDto(
                        userCourse.getCourse().getCourseCode(),
                        userCourse.getCourse().getName()))
                .collect(Collectors.toList()));
        
        // Map interests
        dto.setInterests(user.getInterests().stream()
                .map(userInterest -> new InterestDto(userInterest.getInterest().getName()))
                .collect(Collectors.toList()));
        
        return dto;
    }
    
    /**
     * Map User entity to PublicProfileDto
     */
    private PublicProfileDto mapToPublicProfileDto(User user) {
        return new PublicProfileDto(
                user.getId(),
                user.getFullName(),
                user.getAcademicYear(),
                user.getMajor(),
                user.getUniversity(),
                user.getProfilePictureUrl(),
                user.getBio(),
                user.getStudyStyle(),
                user.getPreferredEnvironment()
        );
    }
}
