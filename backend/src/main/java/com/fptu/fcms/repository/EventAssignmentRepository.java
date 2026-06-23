package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventAssignmentRepository extends JpaRepository<EventAssignment, Integer> {
    List<EventAssignment> findByEventIDAndIsDeletedFalse(Integer eventID);
    List<EventAssignment> findByUserIDAndIsDeletedFalse(Integer userID);
    Optional<EventAssignment> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
}
