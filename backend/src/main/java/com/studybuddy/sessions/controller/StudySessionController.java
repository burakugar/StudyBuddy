package com.studybuddy.sessions.controller;

import com.studybuddy.security.UserDetailsImpl;
import com.studybuddy.sessions.dto.CreateStudySessionDto;
import com.studybuddy.sessions.dto.StudySessionDto;
import com.studybuddy.sessions.dto.UpdateStudySessionDto;
import com.studybuddy.sessions.service.StudySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class StudySessionController {

    private final StudySessionService sessionService;

    /**
     * Endpoint to retrieve a paginated list of all upcoming public study sessions.
     * Accessible by any authenticated user.
     *
     * @param page Page number (0-based).
     * @param size Number of sessions per page.
     * @return ResponseEntity containing a list of upcoming session DTOs.
     */
    @GetMapping // Maps to GET /api/sessions
    public ResponseEntity<List<StudySessionDto>> getAllUpcomingPublicSessions(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        log.debug("Received request for public upcoming sessions with page={}, size={}", page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").ascending());
        List<StudySessionDto> sessions = sessionService.findAllUpcomingPublicSessions(pageable);
        return ResponseEntity.ok(sessions);
    }

    @PostMapping
    public ResponseEntity<StudySessionDto> createSession(
        @Valid @RequestBody CreateStudySessionDto createDto,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("Received request to create session: {}", createDto);
        StudySessionDto createdSession = sessionService.createSession(createDto, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSession);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<StudySessionDto> getSessionById(@PathVariable Long sessionId) {
        log.debug("Received request to get session by ID: {}", sessionId);
        StudySessionDto sessionDto = sessionService.getSessionById(sessionId);
        return ResponseEntity.ok(sessionDto);
    }

    @PutMapping("/{sessionId}")
    @PreAuthorize("@studySessionSecurityService.isCreator(#sessionId, principal.id)")
    public ResponseEntity<StudySessionDto> updateSession(
        @PathVariable Long sessionId,
        @Valid @RequestBody UpdateStudySessionDto updateDto,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("Received request to update session {}: {}", sessionId, updateDto);
        StudySessionDto updatedSession = sessionService.updateSession(sessionId, updateDto, currentUser.getId());
        return ResponseEntity.ok(updatedSession);
    }

    @DeleteMapping("/{sessionId}")
    @PreAuthorize("@studySessionSecurityService.isCreator(#sessionId, principal.id)")
    public ResponseEntity<Void> deleteSession(
        @PathVariable Long sessionId,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("Received request to delete session {}", sessionId);
        sessionService.deleteSession(sessionId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my/upcoming")
    public ResponseEntity<List<StudySessionDto>> getMyUpcomingSessions(
        @AuthenticationPrincipal UserDetailsImpl currentUser,
        @RequestParam(defaultValue = "5") int limit) {
        log.debug("Received request for upcoming sessions for user {} with limit {}", currentUser.getId(), limit);
        List<StudySessionDto> sessions = sessionService.getUpcomingSessions(currentUser.getId(), limit);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/my/all")
    public ResponseEntity<List<StudySessionDto>> getAllMySessions(
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("Received request for all sessions for user {}", currentUser.getId());
        List<StudySessionDto> sessions = sessionService.getAllUserSessions(currentUser.getId());
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/{sessionId}/join")
    public ResponseEntity<StudySessionDto> joinSession(
        @PathVariable Long sessionId,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("Received request for user {} to join session {}", currentUser.getId(), sessionId);
        StudySessionDto sessionDto = sessionService.joinSession(sessionId, currentUser.getId());
        return ResponseEntity.ok(sessionDto);
    }

    @PostMapping("/{sessionId}/leave")
    public ResponseEntity<StudySessionDto> leaveSession(
        @PathVariable Long sessionId,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
        log.debug("Received request for user {} to leave session {}", currentUser.getId(), sessionId);
        StudySessionDto sessionDto = sessionService.leaveSession(sessionId, currentUser.getId());
        return ResponseEntity.ok(sessionDto);
    }
}
