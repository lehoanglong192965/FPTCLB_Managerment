package com.fptu.fcms.repository;

import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface GuestEventRegistrationRepository extends JpaRepository<GuestEventRegistration, Integer> {

    long countByEventIDAndRegistrationStatusInAndIsDeletedFalse(
            Integer eventID,
            Collection<RegistrationStatus> statuses
    );

    @Query("""
    SELECT gr.eventID, COUNT(gr)
    FROM GuestEventRegistration gr
    WHERE gr.eventID IN :eventIDs
      AND gr.registrationStatus IN :statuses
      AND gr.isDeleted = false
    GROUP BY gr.eventID
""")
    List<Object[]> countGroupedByEventIDs(
            @Param("eventIDs") Collection<Integer> eventIDs,
            @Param("statuses") Collection<RegistrationStatus> statuses
    );

    List<GuestEventRegistration> findByEventIDAndIsDeletedFalse(Integer eventID);
    long countByEventIDAndGuestEmailNormalizedAndIsDeletedFalse(Integer eventID, String guestEmailNormalized);
    Optional<GuestEventRegistration> findTopByEventIDAndGuestEmailNormalizedAndRegistrationStatusAndIsDeletedFalseOrderByCancelledAtDesc(
            Integer eventID, String guestEmailNormalized, RegistrationStatus registrationStatus);

    Optional<GuestEventRegistration> findByGuestRegistrationIDAndIsDeletedFalse(Integer guestRegistrationID);

    Optional<GuestEventRegistration> findByGuestReferenceHashAndIsDeletedFalse(String hash);

    boolean existsByRegistrationCodeAndIsDeletedFalse(String code);

    @Query("""
    SELECT CASE WHEN COUNT(gr) > 0 THEN true ELSE false END
    FROM GuestEventRegistration gr
    WHERE gr.eventID = :eventID
      AND LOWER(gr.guestEmailNormalized) = LOWER(:guestEmail)
      AND gr.registrationStatus NOT IN :inactiveStatuses
""")
    boolean existsActiveGuestEmail(
            @Param("eventID") Integer eventID,
            @Param("guestEmail") String guestEmail,
            @Param("inactiveStatuses") Set<RegistrationStatus> inactiveStatuses
    );

    @Query("""
    SELECT CASE WHEN COUNT(gr) > 0 THEN true ELSE false END
    FROM GuestEventRegistration gr
    WHERE gr.eventID = :eventID
      AND gr.guestPhoneNormalized = :guestPhone
      AND gr.registrationStatus NOT IN :inactiveStatuses
""")
    boolean existsActiveGuestPhone(
            @Param("eventID") Integer eventID,
            @Param("guestPhone") String guestPhone,
            @Param("inactiveStatuses") Set<RegistrationStatus> inactiveStatuses
    );
}
