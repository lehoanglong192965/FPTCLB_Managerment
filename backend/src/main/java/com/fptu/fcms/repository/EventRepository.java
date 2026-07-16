package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends Event> S save(S entity);

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends Event> List<S> saveAll(Iterable<S> entities);

    List<Event> findByClubIDAndIsDeletedFalse(Integer clubID);

    List<Event> findByClubIDAndSemesterIDAndIsDeletedFalse(Integer clubID, Integer semesterID);

    Optional<Event> findByEventIDAndIsDeletedFalse(Integer eventID);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.eventID = :eventID AND e.isDeleted = false")
    Optional<Event> findByEventIDAndIsDeletedFalseForUpdate(@Param("eventID") Integer eventID);

    boolean existsByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
            String location,
            Integer eventID,
            EventStatus eventStatus,
            LocalDateTime endDate,
            LocalDateTime startDate
    );

    List<Event> findByEndDateBeforeAndEventStatusInAndIsDeletedFalse(
            LocalDateTime endDate,
            Collection<EventStatus> eventStatuses
    );

    List<Event> findByEventStatusAndIsDeletedFalse(EventStatus status);

    List<Event> findByEventStatusInAndIsDeletedFalse(Collection<EventStatus> statuses);

    // [BR-G02] Tìm các event Pending lâu hơn một mốc thời gian
    List<Event> findByEventStatusAndCreatedAtBeforeAndIsDeletedFalse(EventStatus status, LocalDateTime date);

    List<Event> findByEventStatus(EventStatus completed);

    @Query("""
            SELECT COUNT(e)
            FROM Event e
            WHERE e.semesterID = :semesterId
              AND e.isDeleted = false
              AND (e.eventStatus IS NULL OR e.eventStatus NOT IN :finishedStatuses)
            """)
    long countUnfinishedEventsBySemesterId(
            @Param("semesterId") Integer semesterId,
            @Param("finishedStatuses") Collection<EventStatus> finishedStatuses
    );

    @Query("""
            SELECT COUNT(e)
            FROM Event e
            WHERE e.semesterID = :semesterId
              AND e.isDeleted = false
              AND e.isScoreLocked = true
            """)
    long countLockedScoreEventsBySemesterId(@Param("semesterId") Integer semesterId);
    @Query("""
            SELECT e
            FROM Event e
            WHERE e.isDeleted = false
              AND e.feedbackEnabled = true
              AND (e.feedbackOpensAt IS NULL OR e.feedbackOpensAt <= :now)
              AND (e.feedbackClosesAt IS NULL OR e.feedbackClosesAt > :now)
            """)
    List<Event> findFeedbackOpenEvents(@Param("now") LocalDateTime now);

    Optional<Object> findFirstByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(String location, Integer eventID, EventStatus statusApproved, LocalDateTime endDate, LocalDateTime startDate);
}
