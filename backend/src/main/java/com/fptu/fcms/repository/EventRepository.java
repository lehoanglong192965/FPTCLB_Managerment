package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByClubIDAndIsDeletedFalse(Integer clubID);

    Optional<Event> findByEventIDAndIsDeletedFalse(Integer eventID);

    @Query("SELECT COUNT(e) > 0 FROM Event e " +
            "WHERE e.eventID <> :eventID " +
            "AND e.location = :location " +
            "AND e.eventStatus = 'Approved' " +
            "AND e.isDeleted = false " +
            "AND e.startDate < :endDate " +
            "AND e.endDate > :startDate")
    boolean existsApprovedScheduleConflict(
            @Param("eventID") Integer eventID,
            @Param("location") String location,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT e FROM Event e " +
            "WHERE e.isDeleted = false " +
            "AND e.endDate < :threshold " +
            "AND e.eventStatus IN :statuses")
    List<Event> findReportOverdueEvents(
            @Param("threshold") LocalDateTime threshold,
            @Param("statuses") Collection<String> statuses
    );
}
