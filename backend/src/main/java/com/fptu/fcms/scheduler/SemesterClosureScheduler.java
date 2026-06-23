package com.fptu.fcms.scheduler;

import com.fptu.fcms.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SemesterClosureScheduler {

    private final SemesterService semesterService;

    @Scheduled(cron = "0 0 8 * * ?")
    public void settleRankingsOneDayBeforeSemesterEnds() {
        semesterService.sendSemesterSettlementWarnings();
    }

    @Scheduled(cron = "0 30 8 * * ?")
    public void warnSemestersEndingToday() {
        semesterService.sendSemesterEndDateWarnings();
    }

    @Scheduled(cron = "0 59 23 * * ?")
    public void autoCloseSemestersAtEndOfEndDate() {
        semesterService.autoCloseEndedSemesters();
    }
}
