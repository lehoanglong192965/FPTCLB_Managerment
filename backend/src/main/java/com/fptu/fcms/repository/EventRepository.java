package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByClubIDAndIsDeletedFalse(Integer clubID);

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
}