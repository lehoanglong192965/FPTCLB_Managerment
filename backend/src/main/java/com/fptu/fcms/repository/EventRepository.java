package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByClubIDAndIsDeletedFalse(Integer clubID);
}
