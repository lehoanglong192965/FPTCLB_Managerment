package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Integer> {
    boolean existsByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    Optional<EventRegistration> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    boolean existsByEventIDAndGuestEmailAndIsDeletedFalse(Integer eventID, String guestEmail);
    boolean existsByEventIDAndGuestPhoneAndIsDeletedFalse(Integer eventID, String guestPhone);
    boolean existsByRegistrationCodeAndIsDeletedFalse(String registrationCode);
    Optional<EventRegistration> findByRegistrationIDAndIsDeletedFalse(Integer registrationID);
    Optional<EventRegistration> findByGuestReferenceHashAndIsDeletedFalse(String guestReferenceHash);
    long countByEventIDAndIsDeletedFalse(Integer eventID);
    long countByEventIDAndStatusAndIsDeletedFalse(Integer eventID, String status);
    long countByEventIDAndStatusInAndIsDeletedFalse(Integer eventID, Collection<String> statuses);
    long countByEventIDAndRegistrationStatusInAndIsDeletedFalse(Integer eventID, Collection<String> registrationStatuses);
    List<EventRegistration> findByEventIDAndIsDeletedFalse(Integer eventID);
    List<EventRegistration> findByEventIDAndStatusAndIsDeletedFalse(Integer eventID, String status);
    List<EventRegistration> findByEventIDAndStatusAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, String status);
    List<EventRegistration> findByEventIDAndRegistrationStatusAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, String registrationStatus);
    List<EventRegistration> findByEventIDAndStatusInAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, Collection<String> statuses);
    List<EventRegistration> findByUserIDAndIsDeletedFalse(Integer userID);
    Optional<EventRegistration> findTopByEventIDAndUserIDAndIsDeletedFalseAndStatusInOrderByRegisteredAtDesc(
            Integer eventID,
            Integer userID,
            Collection<String> statuses
    );
    boolean existsByEventIDAndUserIDAndIsDeletedFalseAndStatusIn(
            Integer eventID,
            Integer userID,
            Collection<String> statuses
    );
    boolean existsByEventIDAndGuestEmailAndIsDeletedFalseAndStatusIn(
            Integer eventID,
            String guestEmail,
            Collection<String> statuses
    );
    List<EventRegistration> findByEventIDInAndUserIDInAndStatusAndIsDeletedFalse(
            Collection<Integer> eventIDs,
            Collection<Integer> userIDs,
            String status
    );

    List<EventRegistration> findByEventIDInAndUserIDInAndStatusInAndIsDeletedFalse(
            Collection<Integer> eventIDs,
            Collection<Integer> userIDs,
            Collection<String> statuses
    );

    @Query("SELECT COUNT(r) > 0 FROM EventRegistration r " +
            "WHERE r.eventID = :eventId " +
            "AND r.isDeleted = false " +
            "AND UPPER(COALESCE(r.status, r.registrationStatus, '')) NOT IN :inactiveStatuses " +
            "AND (LOWER(COALESCE(r.guestEmailNormalized, r.guestEmail, '')) = :email)")
    boolean existsActiveGuestEmail(
            @Param("eventId") Integer eventId,
            @Param("email") String email,
            @Param("inactiveStatuses") Collection<String> inactiveStatuses
    );

    @Query("SELECT COUNT(r) > 0 FROM EventRegistration r " +
            "WHERE r.eventID = :eventId " +
            "AND r.isDeleted = false " +
            "AND UPPER(COALESCE(r.status, r.registrationStatus, '')) NOT IN :inactiveStatuses " +
            "AND (COALESCE(r.guestPhoneNormalized, r.guestPhone, '') = :phone)")
    boolean existsActiveGuestPhone(
            @Param("eventId") Integer eventId,
            @Param("phone") String phone,
            @Param("inactiveStatuses") Collection<String> inactiveStatuses
    );
}
