package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClubSizeScheduler {

    private final ClubRepository clubRepository;
    private final SemesterRepository semesterRepository;

    // Chạy lúc 00:00 mỗi ngày để kiểm tra
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void scanAndDeactivateSmallClubs() {
        log.info("Starting scheduled job: Scan and deactivate clubs with < 5 active members (BR-B07).");
        
        // Tự động lấy ID của học kỳ đang Active từ database
        Integer activeSemesterID = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .map(Semester::getSemesterID)
                .orElse(null);

        if (activeSemesterID == null) {
            log.warn("Hệ thống không có học kỳ nào đang Active. Bỏ qua Scheduled Job (BR-B07).");
            return;
        }

        List<Integer> clubsToDeactivate = clubRepository.findClubsToDeactivate(activeSemesterID);

        if (clubsToDeactivate != null && !clubsToDeactivate.isEmpty()) {
            clubRepository.updateStatusToInactive(clubsToDeactivate);
            log.info("Successfully deactivated {} clubs due to BR-B07.", clubsToDeactivate.size());
        } else {
            log.info("No clubs to deactivate.");
        }
    }
}
