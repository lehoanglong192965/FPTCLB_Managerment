package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AllowedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AllowedEmailRepository extends JpaRepository<AllowedEmail, Integer> {
    Optional<AllowedEmail> findByEmail(String email);
    boolean existsByEmail(String email);
}
