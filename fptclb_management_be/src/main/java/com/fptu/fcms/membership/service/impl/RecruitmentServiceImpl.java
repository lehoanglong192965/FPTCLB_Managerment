package com.fptu.fcms.membership.service.impl;

import com.fptu.fcms.entity.RecruitmentApplication;
import com.fptu.fcms.exception.BusinessException;
import com.fptu.fcms.membership.dto.RecruitmentSubmitResponse;
import com.fptu.fcms.membership.repository.ClubMembershipRepository;
import com.fptu.fcms.membership.repository.RecruitmentApplicationRepository;
import com.fptu.fcms.membership.service.RecruitmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RecruitmentServiceImpl implements RecruitmentService {

    private final RecruitmentApplicationRepository recruitmentRepository;
    private final ClubMembershipRepository membershipRepository;

    @Override
    @Transactional // Ensures ACID compliance
    public RecruitmentSubmitResponse submitApplication(Long applicationId, Long userId) {
        // 1. Check if application exists
        RecruitmentApplication app = recruitmentRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("APPLICATION_NOT_FOUND", "Đơn ứng tuyển không tồn tại."));

        // Verify ownership of application
        if (!app.getUser().getUserId().equals(userId)) {
            throw new BusinessException("UNAUTHORIZED_ACTION", "Bạn không có quyền thực hiện thao tác trên đơn này.");
        }

        // Allow submitting draft applications only
        if (!"Draft".equals(app.getStatus())) {
            throw new BusinessException("INVALID_STATE", "Đơn ứng tuyển đã được gửi đi hoặc không còn ở trạng thái nháp.");
        }

        Long semesterId = app.getSemester().getSemesterId();

        // 2. Validate Business Rule: BR-R01 (Max active memberships + pending applications limit is 4)
        // Count active club memberships in current semester
        long activeClubsCount = membershipRepository.countActiveClubs(userId, semesterId);
        // Count pending applications in current semester
        long pendingAppsCount = recruitmentRepository.countPendingApplications(userId, semesterId);

        if (activeClubsCount + pendingAppsCount >= 4) {
            throw new BusinessException(
                "RECRUITMENT_LIMIT_EXCEEDED",
                "Tổng số đơn chờ duyệt và số CLB đang hoạt động của bạn không được vượt quá 4."
            );
        }

        // 3. Update application status
        app.setStatus("Submitted");
        app.setSubmittedAt(LocalDateTime.now());
        recruitmentRepository.save(app);

        // 4. Return result
        return RecruitmentSubmitResponse.builder()
                .applicationId(app.getApplicationId())
                .status(app.getStatus())
                .submittedAt(app.getSubmittedAt())
                .build();
    }
}
