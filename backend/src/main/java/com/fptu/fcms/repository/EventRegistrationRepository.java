package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Integer> {
    @Query("SELECT er.userID, COUNT(er.registrationID) " +
            "FROM EventRegistration er, Event e " +
            "WHERE er.eventID = e.eventID " +
            "AND e.clubID = :clubID " +
            "AND er.status = 'Registered' " +
            "AND er.isDeleted = false " +
            "AND e.isDeleted = false " +
            "GROUP BY er.userID")
    List<Object[]> countRegisteredParticipationByClubID(@Param("clubID") Integer clubID);
}
