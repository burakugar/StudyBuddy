package com.studybuddy.matching;

import com.studybuddy.chat.ChatRepository;
import com.studybuddy.course.dto.CourseDto;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.interest.dto.InterestDto;
import com.studybuddy.matching.dto.MatchActionRequest;
import com.studybuddy.matching.dto.MatchCardDto;
import com.studybuddy.model.*;
import com.studybuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final ChatRepository chatRepository;

    /**
     * Get potential study buddy matches for a user
     */
    public List<MatchCardDto> getPotentialMatches(Long currentUserId, Pageable pageable) {
        // Get the current user with their courses and interests
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        
        // Extract current user's courses and interests for comparison
        Map<String, String> currentUserCourses = extractUserCourses(currentUser);
        Set<String> currentUserInterests = extractUserInterests(currentUser);
        
        // Find potential matches (users not already rejected or matched)
        Page<User> potentialUsers = matchRepository.findPotentialMatches(currentUserId, pageable);
        
        // Transform to DTOs with common courses and interests
        List<MatchCardDto> matchCards = new ArrayList<>();
        for (User potentialMatch : potentialUsers) {
            Map<String, String> potentialMatchCourses = extractUserCourses(potentialMatch);
            Set<String> potentialMatchInterests = extractUserInterests(potentialMatch);
            
            // Find common courses
            List<CourseDto> commonCourses = new ArrayList<>();
            for (Map.Entry<String, String> entry : currentUserCourses.entrySet()) {
                if (potentialMatchCourses.containsKey(entry.getKey())) {
                    commonCourses.add(new CourseDto(entry.getKey(), entry.getValue()));
                }
            }
            
            // Find common interests
            List<InterestDto> commonInterests = new ArrayList<>();
            for (String interest : currentUserInterests) {
                if (potentialMatchInterests.contains(interest)) {
                    commonInterests.add(new InterestDto(interest));
                }
            }
            
            // Create match card with common elements
            MatchCardDto matchCard = new MatchCardDto(
                    potentialMatch.getId(),
                    potentialMatch.getFullName(),
                    potentialMatch.getAcademicYear(),
                    potentialMatch.getMajor(),
                    potentialMatch.getProfilePictureUrl(),
                    commonCourses,
                    commonInterests,
                    potentialMatch.getBio()
            );
            
            matchCards.add(matchCard);
        }
        
        // Sort by commonality (most common courses, then most common interests)
        matchCards.sort((a, b) -> {
            int courseComparison = Integer.compare(b.getCommonCourses().size(), a.getCommonCourses().size());
            if (courseComparison != 0) {
                return courseComparison;
            }
            return Integer.compare(b.getCommonInterests().size(), a.getCommonInterests().size());
        });
        
        return matchCards;
    }

    /**
     * Process a match action (accept or reject)
     */
    @Transactional
    public void processMatchAction(Long currentUserId, Long targetUserId, String action) {
        // Ensure users exist
        userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));
        
        // Ensure we're not matching with ourselves
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot match with yourself");
        }
        
        // Sort user IDs to maintain consistent ordering in the database
        Long userOneId = Math.min(currentUserId, targetUserId);
        Long userTwoId = Math.max(currentUserId, targetUserId);
        
        // Find existing match or create new one
        Match match = matchRepository.findMatchByUserIds(userOneId, userTwoId)
                .orElseGet(() -> {
                    User userOne = new User();
                    userOne.setId(userOneId);
                    
                    User userTwo = new User();
                    userTwo.setId(userTwoId);
                    
                    Match newMatch = new Match();
                    newMatch.setId(MatchId.create(userOneId, userTwoId));
                    newMatch.setUserOne(userOne);
                    newMatch.setUserTwo(userTwo);
                    
                    return newMatch;
                });
        
        // Convert action string to enum
        MatchStatus matchStatus = MatchStatus.valueOf(action);
        
        // Set the appropriate user's status
        if (currentUserId.equals(userOneId)) {
            match.setUserOneStatus(matchStatus);
        } else {
            match.setUserTwoStatus(matchStatus);
        }
        
        // Save the match
        Match savedMatch = matchRepository.save(match);
        
        // If both users have ACCEPTED, create a chat
        if (savedMatch.getUserOneStatus() == MatchStatus.ACCEPTED && 
            savedMatch.getUserTwoStatus() == MatchStatus.ACCEPTED) {
            createChatForMatch(savedMatch);
        }
    }

    /**
     * Create a chat for a matched pair
     */
    @Transactional
    public Chat createChatForMatch(Match match) {
        // Check if a chat already exists
        if (chatRepository.findByMatchUserOneIdAndMatchUserTwoId(match.getId().getUserOneId(), match.getId().getUserTwoId()).isPresent()) {
            return null; // Chat already exists
        }
        
        // Create new chat
        Chat chat = new Chat();
        chat.setMatchUserOneId(match.getId().getUserOneId());
        chat.setMatchUserTwoId(match.getId().getUserTwoId());
        
        return chatRepository.save(chat);
    }

    /**
     * Extract a map of course codes to names from a user
     */
    private Map<String, String> extractUserCourses(User user) {
        Map<String, String> courses = new HashMap<>();
        for (UserCourse userCourse : user.getCourses()) {
            Course course = userCourse.getCourse();
            courses.put(course.getCourseCode(), course.getName());
        }
        return courses;
    }

    /**
     * Extract a set of interest names from a user
     */
    private Set<String> extractUserInterests(User user) {
        return user.getInterests().stream()
                .map(userInterest -> userInterest.getInterest().getName())
                .collect(Collectors.toSet());
    }
}
