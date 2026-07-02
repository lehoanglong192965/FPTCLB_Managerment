package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Integer> {
    boolean existsByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    Optional<EventRegistration> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    boolean existsByEventIDAndGuestEmailAndIsDeletedFalse(Integer eventID, String guestEmail);
    long countByEventIDAndIsDeletedFalse(Integer eventID);
    long countByEventIDAndStatusAndIsDeletedFalse(Integer eventID, RegistrationStatus status);
    long countByEventIDAndStatusInAndIsDeletedFalse(Integer eventID, Collection<RegistrationStatus> statuses);
    List<EventRegistration> findByEventIDAndIsDeletedFalse(Integer eventID);
    List<EventRegistration> findByEventIDAndStatusAndIsDeletedFalse(Integer eventID, RegistrationStatus status);
    List<EventRegistration> findByEventIDAndStatusAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, RegistrationStatus status);
    List<EventRegistration> findByEventIDAndStatusInAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, Collection<RegistrationStatus> statuses);
    List<EventRegistration> findByUserIDAndIsDeletedFalse(Integer userID);
    Optional<EventRegistration> findTopByEventIDAndUserIDAndIsDeletedFalseAndStatusInOrderByRegisteredAtDesc(
            Integer eventID,
            Integer userID,
            Collection<RegistrationStatus> statuses
    );
    boolean existsByEventIDAndUserIDAndIsDeletedFalseAndStatusIn(
            Integer eventID,
            Integer userID,
            Collection<RegistrationStatus> statuses
    );
    boolean existsByEventIDAndGuestEmailAndIsDeletedFalseAndStatusIn(
            Integer eventID,
            String guestEmail,
            Collection<RegistrationStatus> statuses
    );
    List<EventRegistration> findByEventIDInAndUserIDInAndStatusAndIsDeletedFalse(
            Collection<Integer> eventIDs,
            Collection<Integer> userIDs,
            RegistrationStatus status
    );
}
