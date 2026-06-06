package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Club;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClubSizeScheduler {

    private final ClubRepository clubRepository;

    // Chạy lúc 00:00 mỗi ngày để kiểm tra
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void scanAndDeactivateSmallClubs() {
        log.info("Starting scheduled job: Scan and deactivate clubs with < 5 active members (BR-B07).");
        
        // TODO: Cập nhật logic để tự động lấy ID của học kỳ đang Active
        Integer activeSemesterID = 1; 

        List<Integer> clubsToDeactivate = clubRepository.findClubsToDeactivate(activeSemesterID);

        if (clubsToDeactivate != null && !clubsToDeactivate.isEmpty()) {
            clubRepository.updateStatusToInactive(clubsToDeactivate);
            log.info("Successfully deactivated {} clubs due to BR-B07.", clubsToDeactivate.size());
        } else {
            log.info("No clubs to deactivate.");
        }
    }
}
