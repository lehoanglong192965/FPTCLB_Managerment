package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplyClubRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentApplicationResponseDTO;
import com.fptu.fcms.entity.RecruitmentApplication;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubBlacklistRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.RecruitmentApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RecruitmentApplicationServiceImpl implements RecruitmentApplicationService {

    private final RecruitmentApplicationRepository recruitmentRepository;
    private final ClubMembershipRepository membershipRepository;
    private final ClubBlacklistRepository blacklistRepository;

    @Override
    @Transactional
    public RecruitmentApplicationResponseDTO applyForClub(ApplyClubRequestDTO request, Integer currentUserID, Integer currentSemesterID) {
        
        // 1. Kiểm tra Blacklist (BR-B07/Validate 2)
        boolean isBlacklisted = blacklistRepository.existsByClubIDAndUserIDAndIsDeletedFalse(request.getClubID(), currentUserID);
        if (isBlacklisted) {
            throw new BusinessRuleException("Bạn nằm trong danh sách đen của CLB này, không thể nộp đơn.");
        }

        // 2. Đếm số lượng đơn Pending và CLB đang tham gia (BR-R01/Validate 1)
        int pendingApplications = recruitmentRepository.countPendingApplications(currentUserID, currentSemesterID);
        int activeClubs = membershipRepository.countByUserIDAndSemesterIDAndIsDeletedFalse(currentUserID, currentSemesterID);
        
        if ((pendingApplications + activeClubs) >= 4) {
            throw new BusinessRuleException("Vượt quá giới hạn 4 CLB/Đơn ứng tuyển (BR-R01).");
        }

        // 3. Khởi tạo đơn mới
        LocalDateTime now = LocalDateTime.now();
        RecruitmentApplication application = new RecruitmentApplication();
        application.setClubID(request.getClubID());
        application.setUserID(currentUserID);
        application.setSemesterID(currentSemesterID);
        application.setCvUrl(request.getCvUrl());
        application.setIntroduction(request.getIntroduction());
        application.setAnswersJson(request.getAnswersJson());
        application.setStatus("Pending");
        application.setSubmittedAt(now);
        application.setCreatedAt(now);
        application.setIsDeleted(false);

        RecruitmentApplication savedEntity = recruitmentRepository.save(application);

        // Map to Response DTO to avoid Entity leakage
        RecruitmentApplicationResponseDTO response = new RecruitmentApplicationResponseDTO();
        response.setApplicationID(savedEntity.getApplicationID());
        response.setClubID(savedEntity.getClubID());
        response.setUserID(savedEntity.getUserID());
        response.setSemesterID(savedEntity.getSemesterID());
        response.setCvUrl(savedEntity.getCvUrl());
        response.setIntroduction(savedEntity.getIntroduction());
        response.setAnswersJson(savedEntity.getAnswersJson());
        response.setStatus(savedEntity.getStatus());
        response.setSubmittedAt(savedEntity.getSubmittedAt());
        response.setCreatedAt(savedEntity.getCreatedAt());

        return response;
    }
}
