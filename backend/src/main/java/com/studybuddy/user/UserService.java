package com.studybuddy.user;

import com.studybuddy.course.CourseRepository;
import com.studybuddy.course.dto.CourseDto;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.interest.InterestRepository;
import com.studybuddy.interest.dto.InterestDto;
import com.studybuddy.model.*;
import com.studybuddy.user.dto.*; // Import all DTOs from user package
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final InterestRepository interestRepository;

    @Transactional(readOnly = true) // Make read-only where applicable
    public UserProfileDto getUserProfile(Long userId) {
        User user = findUserById(userId);
        return mapToUserProfileDto(user);
    }

    @Transactional
    public UserProfileDto updateUserProfile(Long userId, UserUpdateDto updateDto) {
        User user = findUserById(userId);
        log.debug("Updating profile for user ID: {}", userId);

        // Update basic fields
        Optional.ofNullable(updateDto.getFullName()).ifPresent(user::setFullName);
        Optional.ofNullable(updateDto.getAcademicYear()).ifPresent(user::setAcademicYear);
        Optional.ofNullable(updateDto.getMajor()).ifPresent(user::setMajor);
        Optional.ofNullable(updateDto.getUniversity()).ifPresent(user::setUniversity);
        Optional.ofNullable(updateDto.getBio()).ifPresent(user::setBio);
        Optional.ofNullable(updateDto.getStudyStyle()).ifPresent(user::setStudyStyle);
        Optional.ofNullable(updateDto.getPreferredEnvironment()).ifPresent(user::setPreferredEnvironment);
        Optional.ofNullable(updateDto.getProfilePictureUrl()).ifPresent(user::setProfilePictureUrl);

        // Update location (allow null to clear)
        user.setLatitude(updateDto.getLatitude());
        user.setLongitude(updateDto.getLongitude());
        log.trace("User {} location set to ({}, {})", userId, user.getLatitude(), user.getLongitude());

        // Update courses
        if (updateDto.getCourseCodes() != null) {
            log.trace("Updating courses for user {}: {}", userId, updateDto.getCourseCodes());
            updateUserCourses(user, updateDto.getCourseCodes());
        }

        // Update interests
        if (updateDto.getInterestNames() != null) {
            log.trace("Updating interests for user {}: {}", userId, updateDto.getInterestNames());
            updateUserInterests(user, updateDto.getInterestNames());
        }

        // Update availability slots
        if (updateDto.getAvailabilitySlots() != null) {
            log.trace("Updating availability for user {}: {} slots", userId, updateDto.getAvailabilitySlots().size());
            updateUserAvailability(user, updateDto.getAvailabilitySlots());
        }

        User savedUser = userRepository.save(user);
        log.info("Profile updated successfully for user ID: {}", userId);
        return mapToUserProfileDto(savedUser);
    }

    @Transactional(readOnly = true)
    public PublicProfileDto getPublicProfile(Long userId) {
        User user = findUserById(userId);
        return mapToPublicProfileDto(user);
    }

    @Transactional(readOnly = true)
    public List<NearbyUserDto> findNearbyUsers(Long currentUserId, double radiusKm, int limit) {
        User currentUser = findUserById(currentUserId);
        if (currentUser.getLatitude() == null || currentUser.getLongitude() == null) {
            log.warn("User {} has no location set, cannot find nearby users.", currentUserId);
            return Collections.emptyList();
        }

        log.debug("Finding nearby users for user {} ({}, {}) within {}km (limit {})",
            currentUserId, currentUser.getLatitude(), currentUser.getLongitude(), radiusKm, limit);

        List<User> nearbyUsers = userRepository.findNearbyUsers(
            currentUserId,
            currentUser.getLatitude(),
            currentUser.getLongitude(),
            radiusKm,
            limit);

        log.debug("Found {} raw nearby users.", nearbyUsers.size());

        return nearbyUsers.stream()
            .map(user -> {
                double distance = calculateDistanceKm(
                    currentUser.getLatitude(), currentUser.getLongitude(),
                    user.getLatitude(), user.getLongitude());
                return new NearbyUserDto(
                    user.getId(),
                    user.getFullName(),
                    user.getProfilePictureUrl(),
                    user.getLatitude(),
                    user.getLongitude(),
                    distance);
            })
            .filter(dto -> dto.getDistanceKm() <= radiusKm) // Re-filter based on precise calculation
            .sorted(Comparator.comparingDouble(NearbyUserDto::getDistanceKm))
            .limit(limit) // Apply limit again after sorting
            .collect(Collectors.toList());
    }

    // --- Helper Methods ---

    private User findUserById(Long userId) {
        // Eagerly fetch collections needed for mapping DTOs to avoid LazyInitializationException
        return userRepository.findById(userId)
            .map(user -> {
                // Initialize collections needed for DTO mapping within the transaction
                user.getCourses().size();
                user.getInterests().size();
                user.getAvailabilitySlots().size();
                return user;
            })
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private void updateUserCourses(User user, Set<String> courseCodes) {
        Set<UserCourse> updatedCourses = new HashSet<>();
        if (!courseCodes.isEmpty()) {
            Set<Course> courses = courseRepository.findByCourseCodeIn(courseCodes);
            Map<String, Course> existingCoursesMap = courses.stream()
                .collect(Collectors.toMap(Course::getCourseCode, Function.identity()));

            for (String code : courseCodes) {
                Course course = existingCoursesMap.computeIfAbsent(code, k -> {
                    log.info("Creating new course with code: {}", k);
                    Course newCourse = new Course();
                    newCourse.setCourseCode(k);
                    newCourse.setName(k); // Default name
                    return courseRepository.save(newCourse);
                });
                updatedCourses.add(new UserCourse(user, course));
            }
        }
        // Efficiently update the collection by replacing it
        user.getCourses().clear();
        user.getCourses().addAll(updatedCourses);
    }

    private void updateUserInterests(User user, Set<String> interestNames) {
        Set<UserInterest> updatedInterests = new HashSet<>();
        if (!interestNames.isEmpty()) {
            Set<Interest> interests = interestRepository.findByNameIn(interestNames);
            Map<String, Interest> existingInterestsMap = interests.stream()
                .collect(Collectors.toMap(Interest::getName, Function.identity()));

            for (String name : interestNames) {
                Interest interest = existingInterestsMap.computeIfAbsent(name, k -> {
                    log.info("Creating new interest with name: {}", k);
                    Interest newInterest = new Interest();
                    newInterest.setName(k);
                    return interestRepository.save(newInterest);
                });
                updatedInterests.add(new UserInterest(user, interest));
            }
        }
        // Efficiently update the collection by replacing it
        user.getInterests().clear();
        user.getInterests().addAll(updatedInterests);
    }

    private void updateUserAvailability(User user, List<AvailabilitySlotDto> slotDtos) {
        // Simple strategy: Clear existing and add new ones.
        // More complex merging logic could be added if needed (e.g., based on slot IDs).
        user.getAvailabilitySlots().clear(); // Requires orphanRemoval=true on User.availabilitySlots

        if (slotDtos != null) {
            for (AvailabilitySlotDto dto : slotDtos) {
                // Basic validation (could be more robust)
                if (dto.getDayOfWeek() != null && dto.getStartTime() != null && dto.getEndTime() != null &&
                    dto.getStartTime().isBefore(dto.getEndTime())) {

                    AvailabilitySlot slot = new AvailabilitySlot();
                    slot.setUser(user);
                    slot.setDayOfWeek(dto.getDayOfWeek());
                    slot.setStartTime(dto.getStartTime());
                    slot.setEndTime(dto.getEndTime());
                    user.getAvailabilitySlots().add(slot);
                } else {
                    log.warn("Skipping invalid availability slot DTO for user {}: {}", user.getId(), dto);
                }
            }
        }
        log.debug("Set {} availability slots for user {}", user.getAvailabilitySlots().size(), user.getId());
    }


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
        dto.setLatitude(user.getLatitude());
        dto.setLongitude(user.getLongitude());

        dto.setCourses(user.getCourses().stream()
            .filter(uc -> uc != null && uc.getCourse() != null)
            .map(userCourse -> new CourseDto(
                userCourse.getCourse().getCourseCode(),
                userCourse.getCourse().getName()))
            .sorted(Comparator.comparing(CourseDto::getCourseCode)) // Sort for consistency
            .collect(Collectors.toList()));

        dto.setInterests(user.getInterests().stream()
            .filter(ui -> ui != null && ui.getInterest() != null)
            .map(userInterest -> new InterestDto(userInterest.getInterest().getName()))
            .sorted(Comparator.comparing(InterestDto::getName)) // Sort for consistency
            .collect(Collectors.toList()));

        dto.setAvailabilitySlots(user.getAvailabilitySlots().stream()
            .map(this::mapAvailabilityToDto)
            .sorted(Comparator.comparing(AvailabilitySlotDto::getDayOfWeek) // Sort for consistency
                .thenComparing(AvailabilitySlotDto::getStartTime))
            .collect(Collectors.toList()));

        return dto;
    }

    private AvailabilitySlotDto mapAvailabilityToDto(AvailabilitySlot slot) {
        return new AvailabilitySlotDto(
            slot.getId(),
            slot.getDayOfWeek(),
            slot.getStartTime(),
            slot.getEndTime()
        );
    }

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

    private double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return Double.POSITIVE_INFINITY;
        }
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
