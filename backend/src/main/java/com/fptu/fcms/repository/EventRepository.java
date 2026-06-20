package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByClubIDAndIsDeletedFalse(Integer clubID);

    // [BR-G02] Tìm các event Pending lâu hơn một mốc thời gian
    List<Event> findByEventStatusAndCreatedAtBeforeAndIsDeletedFalse(String status, java.time.LocalDateTime date);
}
