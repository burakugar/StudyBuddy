package com.studybuddy.auth; // Place in auth package or a dedicated password reset package

import com.studybuddy.model.PasswordResetToken;
import com.studybuddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUser(User user); // Useful to prevent multiple tokens per user if desired

    void deleteByUser(User user); // To delete previous tokens

    void deleteByToken(String token); // To delete used token
}
