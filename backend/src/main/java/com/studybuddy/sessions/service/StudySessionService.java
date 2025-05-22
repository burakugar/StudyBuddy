package com.studybuddy.sessions.service;

import com.studybuddy.course.CourseRepository;
import com.studybuddy.exception.ResourceNotFoundException;
import com.studybuddy.model.StudySession;
import com.studybuddy.model.User;
import com.studybuddy.sessions.dto.CreateStudySessionDto;
import com.studybuddy.sessions.dto.StudySessionDto;
import com.studybuddy.sessions.dto.UpdateStudySessionDto;
import com.studybuddy.sessions.repository.StudySessionRepository;
import com.studybuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudySessionService {

    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public StudySessionDto createSession(CreateStudySessionDto dto, Long creatorId) {
        log.info("Creating study session with title '{}' by user {}", dto.getTitle(), creatorId);
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", creatorId));

        if (dto.getEndTime() != null && dto.getStartTime() != null && dto.getEndTime().isBefore(dto.getStartTime())) {
            throw new IllegalArgumentException("End time cannot be before start time");
        }

        StudySession session = new StudySession();
        session.setTitle(dto.getTitle());
        session.setDescription(dto.getDescription());
        session.setStartTime(dto.getStartTime());
        session.setEndTime(dto.getEndTime());
        session.setLocation(dto.getLocation());
        session.setCreator(creator);

        if (dto.getCourseCode() != null && !dto.getCourseCode().isBlank()) {
            courseRepository.findByCourseCode(dto.getCourseCode())
                .ifPresentOrElse(
                    session::setCourse,
                    () -> log.warn("Course code '{}' provided for session creation but not found.", dto.getCourseCode())
                );
        }

        StudySession savedSession = sessionRepository.save(session);
        log.info("Study session created successfully with ID: {}", savedSession.getId());
        return mapToDto(savedSession);
    }

    @Transactional(readOnly = true)
    public List<StudySessionDto> getUpcomingSessions(Long userId, int limit) {
        log.debug("Fetching upcoming sessions for user {} with limit {}", userId, limit);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ZonedDateTime now = ZonedDateTime.now();
        List<StudySession> sessions = sessionRepository.findUpcomingSessionsByParticipant(user, now);

        List<StudySession> limitedSessions = sessions.stream()
            .limit(limit > 0 ? limit : Long.MAX_VALUE)
            .collect(Collectors.toList());

        log.debug("Found {} upcoming sessions for user {}", limitedSessions.size(), userId);
        return limitedSessions.stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudySessionDto> getAllUserSessions(Long userId) {
        log.debug("Fetching all sessions for user {}", userId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<StudySession> sessions = sessionRepository.findAllSessionsByParticipant(user);
        log.debug("Found {} total sessions for user {}", sessions.size(), userId);
        return sessions.stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudySessionDto getSessionById(Long sessionId) {
        log.debug("Fetching session by ID: {}", sessionId);
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("StudySession", "id", sessionId));
        // Ensure participants are loaded if needed for DTO mapping within transaction
        session.getParticipants().size(); // Initialize participants
        return mapToDto(session);
    }

    @Transactional
    public StudySessionDto updateSession(Long sessionId, UpdateStudySessionDto dto, Long updaterId) {
        log.info("Updating session {} by user {}", sessionId, updaterId);
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("StudySession", "id", sessionId));

        if (!session.getCreator().getId().equals(updaterId)) {
            log.warn("User {} attempted to update session {} created by user {}", updaterId, sessionId, session.getCreator().getId());
            throw new AccessDeniedException("Only the creator can update this session");
        }

        Optional.ofNullable(dto.getTitle()).ifPresent(session::setTitle);
        Optional.ofNullable(dto.getDescription()).ifPresent(session::setDescription);
        Optional.ofNullable(dto.getLocation()).ifPresent(session::setLocation);

        ZonedDateTime newStartTime = dto.getStartTime() != null ? dto.getStartTime() : session.getStartTime();
        ZonedDateTime newEndTime = dto.getEndTime();

        if (dto.getStartTime() != null) {
            session.setStartTime(newStartTime);
        }
        session.setEndTime(newEndTime);

        if (session.getEndTime() != null && session.getStartTime() != null && session.getEndTime().isBefore(session.getStartTime())) {
            throw new IllegalArgumentException("End time cannot be before start time");
        }

        if (dto.getCourseCode() != null) {
            if (dto.getCourseCode().isBlank()) {
                session.setCourse(null);
            } else {
                courseRepository.findByCourseCode(dto.getCourseCode())
                    .ifPresentOrElse(
                        session::setCourse,
                        () -> log.warn("Course code '{}' provided for session update but not found.", dto.getCourseCode())
                    );
            }
        }

        StudySession updatedSession = sessionRepository.save(session);
        log.info("Session {} updated successfully", sessionId);
        // Ensure participants are loaded if needed for DTO mapping within transaction
        updatedSession.getParticipants().size(); // Initialize participants
        return mapToDto(updatedSession);
    }


    @Transactional
    public StudySessionDto joinSession(Long sessionId, Long userId) {
        log.info("User {} attempting to join session {}", userId, sessionId);
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("StudySession", "id", sessionId));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Ensure participants are loaded before check/add
        session.getParticipants().size();

        if (session.getParticipants().contains(user)) {
            log.warn("User {} is already a participant in session {}", userId, sessionId);
            return mapToDto(session);
        }

        session.getParticipants().add(user);
        StudySession savedSession = sessionRepository.save(session);
        log.info("User {} successfully joined session {}", userId, sessionId);
        // Ensure participants are loaded if needed for DTO mapping within transaction
        savedSession.getParticipants().size(); // Initialize participants
        return mapToDto(savedSession);
    }

    @Transactional
    public StudySessionDto leaveSession(Long sessionId, Long userId) {
        log.info("User {} attempting to leave session {}", userId, sessionId);
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("StudySession", "id", sessionId));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (session.getCreator().getId().equals(userId)) {
            log.warn("Creator {} attempted to leave their own session {}", userId, sessionId);
            throw new AccessDeniedException("Creator cannot leave their own session. Delete it instead.");
        }

        // Ensure participants are loaded before removal attempt
        session.getParticipants().size();

        boolean removed = session.getParticipants().remove(user);
        if (removed) {
            StudySession savedSession = sessionRepository.save(session);
            log.info("User {} successfully left session {}", userId, sessionId);
            // Ensure participants are loaded if needed for DTO mapping within transaction
            savedSession.getParticipants().size(); // Initialize participants
            return mapToDto(savedSession);
        } else {
            log.warn("User {} attempted to leave session {} but was not a participant.", userId, sessionId);
            return mapToDto(session);
        }
    }

    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        log.info("User {} attempting to delete session {}", userId, sessionId);
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("StudySession", "id", sessionId));

        if (!session.getCreator().getId().equals(userId)) {
            log.warn("User {} attempted to delete session {} created by user {}", userId, sessionId, session.getCreator().getId());
            throw new AccessDeniedException("Only the creator can delete this session");
        }

        sessionRepository.delete(session);
        log.info("Session {} deleted successfully by user {}", sessionId, userId);
    }

    // --- NEW Service Method ---
    /**
     * Finds all upcoming public study sessions, suitable for Browse.
     * @param pageable Pagination information.
     * @return A list of StudySessionDto.
     */
    @Transactional(readOnly = true)
    public List<StudySessionDto> findAllUpcomingPublicSessions(Pageable pageable) {
        ZonedDateTime now = ZonedDateTime.now();
        log.debug("Fetching all upcoming public sessions starting after {} with pageable: {}", now, pageable);
        // Ensure sorting is applied if not provided by pageable default
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.ASC, "startTime"));
        Page<StudySession> sessionPage = sessionRepository.findAllUpcomingPublic(now, sortedPageable);
        log.info("Found {} public upcoming sessions (Page {} of {})", sessionPage.getNumberOfElements(), pageable.getPageNumber(), sessionPage.getTotalPages());
        return sessionPage.getContent().stream()
            .map(session -> {
                // Initialize participants within the transaction before mapping
                session.getParticipants().size();
                return mapToDto(session);
            })
            .collect(Collectors.toList());
    }
    // --- END NEW Service Method ---


    private StudySessionDto mapToDto(StudySession session) {
        StudySessionDto dto = new StudySessionDto();
        dto.setId(session.getId());
        dto.setTitle(session.getTitle());
        dto.setDescription(session.getDescription());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setLocation(session.getLocation());
        dto.setCreatorId(session.getCreator().getId());
        dto.setCreatorName(session.getCreator().getFullName());
        if (session.getCourse() != null) {
            dto.setCourseCode(session.getCourse().getCourseCode());
        }
        // Map participant IDs - assumes participants are loaded
        List<Long> participantIds = session.getParticipants().stream()
            .map(User::getId)
            .sorted()
            .collect(Collectors.toList());
        dto.setParticipantIds(participantIds);
        dto.setParticipantCount(participantIds.size());
        return dto;
    }
}
