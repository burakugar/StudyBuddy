package com.studybuddy.user;

import com.studybuddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Boolean existsByEmailIgnoreCase(@Param("email") String email);

    // Fixed SQL query for nearby users - using WHERE instead of HAVING for the distance filter
    @Query(value = "SELECT u.*, " +
        "( 6371 * acos( cos( radians(:lat) ) * cos( radians( u.latitude ) ) * cos( radians( u.longitude ) - radians(:lon) ) + sin( radians(:lat) ) * sin( radians( u.latitude ) ) ) ) AS distance " +
        "FROM users u " +
        "WHERE u.id != :userId " +
        "AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL " +
        "AND ( 6371 * acos( cos( radians(:lat) ) * cos( radians( u.latitude ) ) * cos( radians( u.longitude ) - radians(:lon) ) + sin( radians(:lat) ) * sin( radians( u.latitude ) ) ) ) < :radius " +
        "ORDER BY distance " +
        "LIMIT :limit", nativeQuery = true)
    List<User> findNearbyUsers(
        @Param("userId") Long userId,
        @Param("lat") double latitude,
        @Param("lon") double longitude,
        @Param("radius") double radius,
        @Param("limit") int limit);
}
