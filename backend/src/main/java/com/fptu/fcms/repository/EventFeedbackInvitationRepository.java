package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventFeedbackInvitation;
import com.fptu.fcms.enums.FeedbackInvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventFeedbackInvitationRepository extends JpaRepository<EventFeedbackInvitation, Integer> {
    Optional<EventFeedbackInvitation> findByTokenHashAndIsDeletedFalse(String tokenHash);

    boolean existsByEventIDAndRegistrationIDAndIsDeletedFalse(Integer eventID, Integer registrationID);

    boolean existsByEventIDAndGuestRegistrationIDAndIsDeletedFalse(Integer eventID, Integer guestRegistrationID);

    List<EventFeedbackInvitation> findByStatusAndExpiresAtBeforeAndIsDeletedFalse(
            FeedbackInvitationStatus status,
            LocalDateTime expiresAt
    );
}