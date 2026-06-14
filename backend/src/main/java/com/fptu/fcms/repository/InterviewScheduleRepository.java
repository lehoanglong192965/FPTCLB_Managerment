package com.fptu.fcms.repository;

import com.fptu.fcms.entity.InterviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, Integer> {

    Optional<InterviewSchedule> findTopByApplicationIDAndIsDeletedFalseOrderByCreatedAtDesc(
            Integer applicationID
    );
}
