package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.SchedulerLog;
import com.fptu.fcms.repository.SchedulerLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Base class for all schedulers to ensure idempotency (each job runs only once per day).
 */
@Slf4j
public abstract class BaseScheduler {

    private final SchedulerLogRepository schedulerLogRepository;

    protected BaseScheduler(SchedulerLogRepository schedulerLogRepository) {
        this.schedulerLogRepository = schedulerLogRepository;
    }

    /**
     * Tries to acquire a lock for the specific job on the specific date.
     * Uses Propagation.REQUIRES_NEW to ensure the transaction commits the lock immediately.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean acquireExecutionLock(String jobName, LocalDate date) {
        if (schedulerLogRepository.existsByJobNameAndExecutionDate(jobName, date)) {
            return false;
        }
        try {
            SchedulerLog logEntry = new SchedulerLog();
            logEntry.setJobName(jobName);
            logEntry.setExecutionDate(date);
            logEntry.setExecutedAt(LocalDateTime.now());
            logEntry.setStatus("STARTED");
            schedulerLogRepository.saveAndFlush(logEntry);
            return true;
        } catch (DataIntegrityViolationException e) {
            // Another instance inserted the log first
            return false;
        }
    }

    /**
     * Executes the task idempotently.
     */
    public void executeIdempotent(String jobName, Runnable task) {
        LocalDate today = LocalDate.now();
        if (acquireExecutionLock(jobName, today)) {
            try {
                log.info("Starting scheduled job: {}", jobName);
                task.run();
                updateJobStatus(jobName, today, "COMPLETED");
                log.info("Completed scheduled job: {}", jobName);
            } catch (Exception e) {
                log.error("Failed scheduled job: {}", jobName, e);
                updateJobStatus(jobName, today, "FAILED");
            }
        } else {
            log.debug("Job {} already executed today. Skipping.", jobName);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateJobStatus(String jobName, LocalDate date, String status) {
        schedulerLogRepository.findByJobNameAndExecutionDate(jobName, date).ifPresent(logEntry -> {
            logEntry.setStatus(status);
            schedulerLogRepository.save(logEntry);
        });
    }
}
