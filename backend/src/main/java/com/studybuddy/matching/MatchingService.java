package com.studybuddy.matching;

import com.studybuddy.chat.ChatRepository;
import com.studybuddy.course.dto.CourseDto;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.interest.dto.InterestDto;
import com.studybuddy.matching.dto.MatchCardDto;
import com.studybuddy.model.*;
import com.studybuddy.user.UserRepository;
import com.studybuddy.user.dto.AvailabilitySlotDto; // Import needed DTO
import com.studybuddy.user.UserService; // Import UserService for mapping
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final ChatRepository chatRepository;
    // No need for UserService directly if we fetch users with collections

    @Transactional(readOnly = true)
    public List<MatchCardDto> getPotentialMatches(Long currentUserId, Pageable pageable) {
        User currentUser = userRepository.findById(currentUserId)
            .map(user -> { // Eagerly fetch needed collections
                user.getCourses().size();
                user.getInterests().size();
                user.getAvailabilitySlots().size();
                return user;
            })
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Set<String> currentUserCourses = extractUserCourseCodes(currentUser);
        Set<String> currentUserInterests = extractUserInterestNames(currentUser);
        Set<AvailabilitySlot> currentUserSlots = currentUser.getAvailabilitySlots();

        Page<User> potentialUsersPage = matchRepository.findPotentialMatches(currentUserId, pageable);
        log.debug("Found {} potential raw matches for user {} (Page {} of size {})",
            potentialUsersPage.getTotalElements(), currentUserId, pageable.getPageNumber(), pageable.getPageSize());

        List<MatchCardDto> matchCards = new ArrayList<>();
        for (User potentialMatch : potentialUsersPage.getContent()) {
            // Eager fetch collections for the potential match
            User potentialMatchFull = userRepository.findById(potentialMatch.getId())
                .map(user -> {
                    user.getCourses().size();
                    user.getInterests().size();
                    user.getAvailabilitySlots().size();
                    return user;
                })
                .orElse(null); // Or handle error

            if (potentialMatchFull == null) {
                log.warn("Could not fully load potential match user {}", potentialMatch.getId());
                continue;
            }

            Set<String> potentialMatchCourses = extractUserCourseCodes(potentialMatchFull);
            Set<String> potentialMatchInterests = extractUserInterestNames(potentialMatchFull);
            Set<AvailabilitySlot> potentialMatchSlots = potentialMatchFull.getAvailabilitySlots();

            // Calculate Common Courses & Interests
            List<CourseDto> commonCourses = currentUser.getCourses().stream()
                .map(UserCourse::getCourse)
                .filter(Objects::nonNull)
                .filter(course -> potentialMatchCourses.contains(course.getCourseCode()))
                .map(course -> new CourseDto(course.getCourseCode(), course.getName()))
                .sorted(Comparator.comparing(CourseDto::getCourseCode))
                .collect(Collectors.toList());

            List<InterestDto> commonInterests = currentUser.getInterests().stream()
                .map(UserInterest::getInterest)
                .filter(Objects::nonNull)
                .filter(interest -> potentialMatchInterests.contains(interest.getName()))
                .map(interest -> new InterestDto(interest.getName()))
                .sorted(Comparator.comparing(InterestDto::getName))
                .collect(Collectors.toList());

            // Calculate Availability Overlap Score (Simple Example)
            double availabilityScore = calculateAvailabilityOverlapScore(currentUserSlots, potentialMatchSlots);

            // Create DTO
            MatchCardDto matchCard = new MatchCardDto(
                potentialMatchFull.getId(),
                potentialMatchFull.getFullName(),
                potentialMatchFull.getAcademicYear(),
                potentialMatchFull.getMajor(),
                potentialMatchFull.getProfilePictureUrl(),
                commonCourses,
                commonInterests,
                potentialMatchFull.getBio(),
                availabilityScore // Add score to DTO
            );

            matchCards.add(matchCard);
        }

        // Sort based on a combined score (example: more weight to courses, then interests, then availability)
        matchCards.sort((a, b) -> {
            double scoreA = (a.getCommonCourses().size() * 3.0) + (a.getCommonInterests().size() * 1.5) + a.getAvailabilityScore();
            double scoreB = (b.getCommonCourses().size() * 3.0) + (b.getCommonInterests().size() * 1.5) + b.getAvailabilityScore();
            return Double.compare(scoreB, scoreA); // Higher score first
        });

        log.info("Returning {} sorted potential match cards for user {}", matchCards.size(), currentUserId);
        return matchCards;
    }

    @Transactional
    public void processMatchAction(Long currentUserId, Long targetUserId, String action) {
        log.info("Processing match action: User {} -> User {}, Action: {}", currentUserId, targetUserId, action);
        // Fetch users (consider if full entity is needed or just reference)
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User targetUser = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (currentUserId.equals(targetUserId)) {
            log.warn("User {} attempted to match with themselves.", currentUserId);
            throw new IllegalArgumentException("Cannot match with yourself");
        }

        MatchId matchId = MatchId.create(currentUserId, targetUserId);

        Match match = matchRepository.findById(matchId)
            .orElseGet(() -> {
                log.debug("Creating new match entry for users {} and {}", matchId.getUserOneId(), matchId.getUserTwoId());
                Match newMatch = new Match();
                newMatch.setId(matchId);
                // Use fetched entities or references
                newMatch.setUserOne(userRepository.getReferenceById(matchId.getUserOneId()));
                newMatch.setUserTwo(userRepository.getReferenceById(matchId.getUserTwoId()));
                return newMatch;
            });

        MatchStatus matchStatus = MatchStatus.valueOf(action);

        // Set status based on which user ID is performing the action
        if (currentUserId.equals(matchId.getUserOneId())) {
            log.debug("Setting User One ({}) status to {}", currentUserId, matchStatus);
            match.setUserOneStatus(matchStatus);
        } else { // currentUserId must be userTwoId
            log.debug("Setting User Two ({}) status to {}", currentUserId, matchStatus);
            match.setUserTwoStatus(matchStatus);
        }

        // Explicitly calculate and set the overall status string before saving
        String calculatedStatus = match.calculateStatus();
        match.setStatus(calculatedStatus);
        log.debug("Calculated overall match status: {}", calculatedStatus);

        Match savedMatch = matchRepository.save(match);
        log.info("Saved match entry with ID {} and Status {}", savedMatch.getId(), savedMatch.getStatus());


        // Create chat only if the status becomes MATCHED
        if (savedMatch.getStatus().equals("MATCHED")) {
            log.info("Match confirmed between User {} and User {}. Attempting to create chat.", matchId.getUserOneId(), matchId.getUserTwoId());
            createChatForMatch(savedMatch);
        } else {
            log.debug("Match status is not MATCHED ({}), not creating chat.", savedMatch.getStatus());
        }
    }


    @Transactional // Keep transactional for chat creation
    public Chat createChatForMatch(Match match) {
        MatchId matchId = match.getId();
        Optional<Chat> existingChat = chatRepository.findChatByParticipantIds(matchId.getUserOneId(), matchId.getUserTwoId());

        if (existingChat.isPresent()) {
            log.warn("Chat already exists for match between users {} and {}. Skipping creation.", matchId.getUserOneId(), matchId.getUserTwoId());
            return existingChat.get();
        }

        log.info("Creating new chat for matched users {} and {}", matchId.getUserOneId(), matchId.getUserTwoId());
        Chat chat = new Chat();
        chat.setMatchUserOneId(matchId.getUserOneId());
        chat.setMatchUserTwoId(matchId.getUserTwoId());
        // createdAt is set by @PrePersist

        Chat savedChat = chatRepository.save(chat);
        log.info("Chat created successfully with ID: {}", savedChat.getId());
        return savedChat;
    }


    // --- Helper Methods ---

    private Set<String> extractUserCourseCodes(User user) {
        if (user.getCourses() == null) {
            return Collections.emptySet();
        }
        return user.getCourses().stream()
            .map(UserCourse::getCourse)
            .filter(Objects::nonNull)
            .map(Course::getCourseCode)
            .collect(Collectors.toSet());
    }

    private Set<String> extractUserInterestNames(User user) {
        if (user.getInterests() == null) {
            return Collections.emptySet();
        }
        return user.getInterests().stream()
            .map(UserInterest::getInterest)
            .filter(Objects::nonNull)
            .map(Interest::getName)
            .collect(Collectors.toSet());
    }

    private double calculateAvailabilityOverlapScore(Set<AvailabilitySlot> slots1, Set<AvailabilitySlot> slots2) {
        if (slots1 == null || slots2 == null || slots1.isEmpty() || slots2.isEmpty()) {
            return 0.0;
        }

        double totalOverlapHours = 0;

        Map<DayOfWeek, List<AvailabilitySlot>> slots1ByDay = slots1.stream()
            .collect(Collectors.groupingBy(AvailabilitySlot::getDayOfWeek));
        Map<DayOfWeek, List<AvailabilitySlot>> slots2ByDay = slots2.stream()
            .collect(Collectors.groupingBy(AvailabilitySlot::getDayOfWeek));

        for (DayOfWeek day : slots1ByDay.keySet()) {
            if (slots2ByDay.containsKey(day)) {
                List<AvailabilitySlot> daySlots1 = slots1ByDay.get(day);
                List<AvailabilitySlot> daySlots2 = slots2ByDay.get(day);

                for (AvailabilitySlot s1 : daySlots1) {
                    for (AvailabilitySlot s2 : daySlots2) {
                        totalOverlapHours += calculateTimeOverlapHours(s1.getStartTime(), s1.getEndTime(), s2.getStartTime(), s2.getEndTime());
                    }
                }
            }
        }

        // Normalize score (e.g., based on total possible hours or just return raw hours)
        // Simple approach: return total overlap hours (higher is better)
        // More complex: Divide by total available hours for one user, etc.
        log.trace("Calculated availability overlap: {} hours", totalOverlapHours);
        return totalOverlapHours; // Return raw hours for now
    }

    private double calculateTimeOverlapHours(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        // Find the overlapping interval
        LocalTime overlapStart = start1.isAfter(start2) ? start1 : start2;
        LocalTime overlapEnd = end1.isBefore(end2) ? end1 : end2;

        // Check if there is an overlap
        if (overlapStart.isBefore(overlapEnd)) {
            // Calculate duration in minutes and convert to hours
            long overlapMinutes = java.time.Duration.between(overlapStart, overlapEnd).toMinutes();
            return overlapMinutes / 60.0;
        } else {
            // No overlap
            return 0.0;
        }
    }
}
