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

    List<Event> findByClubIDAndSemesterIDAndIsDeletedFalse(Integer clubID, Integer semesterID);

    Optional<Event> findByEventIDAndIsDeletedFalse(Integer eventID);

    boolean existsByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
            String location,
            Integer eventID,
            String eventStatus,
            LocalDateTime endDate,
            LocalDateTime startDate
    );

    List<Event> findByEndDateBeforeAndEventStatusInAndIsDeletedFalse(
            LocalDateTime endDate,
            Collection<String> eventStatuses
    );

    List<Event> findByEventStatusAndIsDeletedFalse(String status);

    // [BR-G02] Tìm các event Pending lâu hơn một mốc thời gian
    List<Event> findByEventStatusAndCreatedAtBeforeAndIsDeletedFalse(String status, LocalDateTime date);

    List<Event> findByEventStatus(String completed);
}
    @Query("""
            SELECT COUNT(e)
            FROM Event e
            WHERE e.semesterID = :semesterId
              AND e.isDeleted = false
              AND (e.eventStatus IS NULL OR e.eventStatus NOT IN :finishedStatuses)
            """)
    long countUnfinishedEventsBySemesterId(
            @Param("semesterId") Integer semesterId,
            @Param("finishedStatuses") Collection<String> finishedStatuses
    );

    @Query("""
            SELECT COUNT(e)
            FROM Event e
            WHERE e.semesterID = :semesterId
              AND e.isDeleted = false
              AND e.isScoreLocked = true
            """)
    long countLockedScoreEventsBySemesterId(@Param("semesterId") Integer semesterId);
}
