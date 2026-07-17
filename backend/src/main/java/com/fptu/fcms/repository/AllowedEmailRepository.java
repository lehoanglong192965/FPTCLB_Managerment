package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AllowedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AllowedEmailRepository extends JpaRepository<AllowedEmail, Integer> {
    Optional<AllowedEmail> findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<AllowedEmail> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT TOP 1 * FROM AllowedEmailWhitelist WHERE LOWER(email) = LOWER(:email)",
        nativeQuery = true
    )
    Optional<AllowedEmail> findAnyByEmailIgnoreCase(@org.springframework.data.repository.query.Param("email") String email);
}
