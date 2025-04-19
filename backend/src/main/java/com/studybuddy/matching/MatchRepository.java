package com.studybuddy.matching;

import com.studybuddy.model.Match;
import com.studybuddy.model.MatchId;
import com.studybuddy.model.MatchStatus;
import com.studybuddy.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, MatchId> {
    
    /**
     * Finds a match by user ids, ensuring proper ordering (smaller id first)
     */
    @Query("SELECT m FROM Match m WHERE " +
           "(m.id.userOneId = :userOneId AND m.id.userTwoId = :userTwoId)")
    Optional<Match> findMatchByUserIds(@Param("userOneId") Long userOneId, 
                                      @Param("userTwoId") Long userTwoId);
    
    /**
     * Find potential matches for a user:
     * - Not already rejected
     * - Not the user themselves
     * - Order by common courses and interests (requires separate logic in service)
     */
    @Query("SELECT u FROM User u WHERE u.id != :userId AND " +
           "u.id NOT IN (SELECT m.id.userTwoId FROM Match m WHERE m.id.userOneId = :userId AND " +
           "(m.userOneStatus = 'REJECTED' OR m.status = 'MATCHED')) AND " +
           "u.id NOT IN (SELECT m.id.userOneId FROM Match m WHERE m.id.userTwoId = :userId AND " +
           "(m.userTwoStatus = 'REJECTED' OR m.status = 'MATCHED'))")
    Page<User> findPotentialMatches(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Find all matches where a user has accepted and is waiting for the other user
     */
    @Query("SELECT m FROM Match m WHERE " +
           "(m.id.userOneId = :userId AND m.userOneStatus = 'ACCEPTED' AND m.userTwoStatus = 'PENDING') OR " +
           "(m.id.userTwoId = :userId AND m.userTwoStatus = 'ACCEPTED' AND m.userOneStatus = 'PENDING')")
    Page<Match> findPendingMatchesForUser(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Find all matched connections (both accepted)
     */
    @Query("SELECT m FROM Match m WHERE " +
           "((m.id.userOneId = :userId) OR (m.id.userTwoId = :userId)) AND m.status = 'MATCHED'")
    Page<Match> findMatchedConnectionsForUser(@Param("userId") Long userId, Pageable pageable);
}
