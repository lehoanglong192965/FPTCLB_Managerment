package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Integer> {
    boolean existsByEventIDAndRegistrationIDAndIsDeletedFalse(Integer eventID, Integer registrationID);

    boolean existsByEventIDAndGuestRegistrationIDAndIsDeletedFalse(Integer eventID, Integer guestRegistrationID);

    List<EventFeedback> findByEventIDAndIsDeletedFalse(Integer eventID);
}