package com.studybuddy.sessions.repository;

import com.studybuddy.model.StudySession;
import com.studybuddy.model.User;
import org.springframework.data.domain.Page; // Import Page
import org.springframework.data.domain.Pageable; // Import Pageable
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    @Query("SELECT s FROM StudySession s JOIN s.participants p WHERE p = :user AND (s.endTime IS NULL OR s.endTime > :now) ORDER BY s.startTime ASC")
    List<StudySession> findUpcomingSessionsByParticipant(@Param("user") User user, @Param("now") ZonedDateTime now);

    @Query("SELECT s FROM StudySession s JOIN s.participants p WHERE p = :user ORDER BY s.startTime DESC")
    List<StudySession> findAllSessionsByParticipant(@Param("user") User user);

    List<StudySession> findByCreatorOrderByStartTimeDesc(User creator);

    List<StudySession> findByCourseIdOrderByStartTimeDesc(Integer courseId);

    /**
     * Finds all study sessions that start after the given time, ordered by start time.
     * Uses pagination.
     * @param now The current time to filter sessions starting after this point.
     * @param pageable Pagination information.
     * @return A Page of upcoming StudySessions.
     */
    @Query("SELECT s FROM StudySession s WHERE s.startTime > :now ORDER BY s.startTime ASC")
    Page<StudySession> findAllUpcomingPublic(@Param("now") ZonedDateTime now, Pageable pageable);
}
