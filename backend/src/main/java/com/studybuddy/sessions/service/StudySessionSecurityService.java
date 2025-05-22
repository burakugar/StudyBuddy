package com.studybuddy.sessions.service;

import com.studybuddy.model.StudySession;
import com.studybuddy.sessions.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component; // Use @Component or @Service
import org.springframework.transaction.annotation.Transactional; // Optional, but good practice

import java.util.Optional;

@Component("studySessionSecurityService") // Register bean with the specific name used in @PreAuthorize
@RequiredArgsConstructor
@Slf4j
public class StudySessionSecurityService {

    private final StudySessionRepository sessionRepository;

    /**
     * Checks if the given user is the creator of the specified session.
     * Used in @PreAuthorize expressions.
     *
     * @param sessionId The ID of the session to check.
     * @param userId    The ID of the user attempting the action.
     * @return true if the user is the creator, false otherwise.
     */
    @Transactional(readOnly = true) // Good practice for read operations
    public boolean isCreator(Long sessionId, Long userId) {
        if (sessionId == null || userId == null) {
            log.warn("isCreator check called with null sessionId ({}) or userId ({})", sessionId, userId);
            return false; // Cannot be creator if IDs are null
        }

        log.debug("Security check: isCreator for session {} by user {}", sessionId, userId);

        // Fetch the session safely
        Optional<StudySession> sessionOpt = sessionRepository.findById(sessionId);

        if (sessionOpt.isEmpty()) {
            log.warn("Security check failed: Session {} not found.", sessionId);
            return false; // Session doesn't exist, so user cannot be creator
        }

        StudySession session = sessionOpt.get();

        // Check if the creator exists and the ID matches
        if (session.getCreator() == null || session.getCreator().getId() == null) {
            log.error("Data integrity issue: Session {} found but has null creator or creator ID.", sessionId);
            return false; // Cannot verify creator if data is inconsistent
        }

        boolean isCreator = session.getCreator().getId().equals(userId);
        log.debug("Security check result for session {}: isCreator = {}", sessionId, isCreator);
        return isCreator;
    }

    /**
     * Checks if the given user is a participant (including the creator)
     * of the specified session.
     *
     * @param sessionId The ID of the session to check.
     * @param userId    The ID of the user attempting the action.
     * @return true if the user is a participant, false otherwise.
     */
    @Transactional(readOnly = true)
    public boolean isParticipant(Long sessionId, Long userId) {
        if (sessionId == null || userId == null) {
            log.warn("isParticipant check called with null sessionId ({}) or userId ({})", sessionId, userId);
            return false;
        }
        log.debug("Security check: isParticipant for session {} by user {}", sessionId, userId);

        // Use exists query for efficiency if repository supports it, otherwise fetch
        Optional<StudySession> sessionOpt = sessionRepository.findById(sessionId); // Fetch participants eagerly if needed or use a specific query

        if (sessionOpt.isEmpty()) {
            log.warn("Security check failed: Session {} not found.", sessionId);
            return false;
        }

        // Check if the user ID is present in the participant IDs
        // Ensure participants are loaded if lazy fetching is used
        boolean isParticipant = sessionOpt.get().getParticipants().stream()
            .anyMatch(participant -> participant != null && userId.equals(participant.getId()));

        log.debug("Security check result for session {}: isParticipant = {}", sessionId, isParticipant);
        return isParticipant;
    }
}
