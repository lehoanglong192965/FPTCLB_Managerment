package com.fptu.fcms.repository;

import com.fptu.fcms.entity.GuestVerificationOtp;
import com.fptu.fcms.enums.GuestOtpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestVerificationOtpRepository extends JpaRepository<GuestVerificationOtp, Integer> {
    Optional<GuestVerificationOtp> findFirstByGuestEmailAndIsDeletedFalseOrderByCreatedAtDesc(String guestEmail);

    Optional<GuestVerificationOtp> findTopByGuestRegistrationIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            Integer guestRegistrationID,
            GuestOtpStatus status
    );

    Optional<GuestVerificationOtp> findByChallengeHashAndStatusAndIsDeletedFalse(
            String challengeHash, GuestOtpStatus status);
}
