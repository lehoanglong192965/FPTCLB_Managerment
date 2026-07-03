package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.RegistrationStatus;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Integer> {
    boolean existsByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    Optional<EventRegistration> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    boolean existsByEventIDAndGuestEmailAndIsDeletedFalse(Integer eventID, String guestEmail);
    long countByEventIDAndIsDeletedFalse(Integer eventID);
    long countByEventIDAndRegistrationStatusInAndIsDeletedFalse(Integer eventID, Collection<RegistrationStatus> statuses);
    List<EventRegistration> findByEventIDAndIsDeletedFalse(Integer eventID);
    List<EventRegistration> findByEventIDAndRegistrationStatusAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, RegistrationStatus status);
    List<EventRegistration> findByUserIDAndIsDeletedFalse(Integer userID);
    Optional<EventRegistration> findTopByEventIDAndUserIDAndIsDeletedFalseAndRegistrationStatusInOrderByRegisteredAtDesc(
            Integer eventID,
            Integer userID,
            Collection<RegistrationStatus> statuses
    );
    boolean existsByEventIDAndUserIDAndIsDeletedFalseAndRegistrationStatusIn(
            Integer eventID,
            Integer userID,
            Collection<RegistrationStatus> statuses
    );

    @Query("""
    SELECT er.registrationStatus
    FROM EventRegistration er
    WHERE er.userID = :userID
      AND er.isDeleted = false
""")
    Collection<RegistrationStatus> statusesByUserIDAndIsDeletedFalse(
            @Param("userID") Integer userID
    );
        RegistrationStatus getRegistrationStatusByUserIDAndIsDeletedFalse(Integer userID);

    boolean existsByEventIDAndGuestEmailAndIsDeletedFalseAndRegistrationStatusIn(
            Integer eventID,
            String guestEmail,
            Collection<RegistrationStatus> statuses
    );
    List<EventRegistration> findByEventIDInAndUserIDInAndRegistrationStatusAndIsDeletedFalse(
            Collection<Integer> eventIDs,
            Collection<Integer> userIDs,
            RegistrationStatus status
    );

    Optional<EventRegistration> findByRegistrationIDAndIsDeletedFalse(Integer registrationId);

    Collection<EventRegistration> findByEventIDInAndUserIDInAndStatusInAndIsDeletedFalse(Collection<Integer> eventID, Collection<Integer> userID, Collection<String> status);

    @Query("""
    SELECT CASE WHEN COUNT(er) > 0 THEN true ELSE false END
    FROM EventRegistration er
    WHERE er.eventID = :eventID
      AND LOWER(er.guestEmail) = LOWER(:guestEmail)
      AND er.registrationStatus IN :statuses
""")
    boolean existsActiveGuestEmail(
            @Param("eventID") Integer eventID,
            @Param("guestEmail") String guestEmail,
            @Param("statuses") Set<String> statuses
    );
    @Query("""
    SELECT CASE WHEN COUNT(er) > 0 THEN true ELSE false END
    FROM EventRegistration er
    WHERE er.eventID = :eventID
      AND er.guestPhone = :guestPhone
      AND er.registrationStatus IN :statuses
""")
    boolean existsActiveGuestPhone(
            @Param("eventID") Integer eventID,
            @Param("guestPhone") String guestPhone,
            @Param("statuses") Set<String> statuses
    );
    Optional<Object> findByGuestReferenceHashAndIsDeletedFalse(String hash);

    boolean existsByRegistrationCodeAndIsDeletedFalse(String code);

    // Custom query for GuestOtpExpiryScheduler — avoids loading entire table
    @Query("SELECT r FROM EventRegistration r WHERE r.registrationStatus = :status AND r.createdAt < :threshold AND r.isDeleted = false")
    List<EventRegistration> findByRegistrationStatusAndCreatedAtBeforeAndIsDeletedFalse(
            @Param("status") RegistrationStatus status,
            @Param("threshold") java.time.LocalDateTime threshold
    );
}
