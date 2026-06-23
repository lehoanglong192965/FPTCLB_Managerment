package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventAssignmentRepository extends JpaRepository<EventAssignment, Integer> {
    List<EventAssignment> findByEventIDAndIsDeletedFalse(Integer eventID);
}
