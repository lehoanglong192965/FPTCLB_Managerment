package com.fptu.fcms.repository;

import com.fptu.fcms.entity.SchedulerLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface SchedulerLogRepository extends JpaRepository<SchedulerLog, Integer> {
    boolean existsByJobNameAndExecutionDate(String jobName, LocalDate executionDate);
    Optional<SchedulerLog> findByJobNameAndExecutionDate(String jobName, LocalDate executionDate);
}
