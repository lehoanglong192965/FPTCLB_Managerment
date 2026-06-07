package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplyClubRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentApplicationResponseDTO;
import com.fptu.fcms.entity.RecruitmentApplication;
import com.fptu.fcms.entity.WithdrawLog;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubBlacklistRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.RecruitmentApplicationRepository;
import com.fptu.fcms.repository.WithdrawLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RecruitmentApplicationServiceImpl implements RecruitmentApplicationService {

    // [BR-R08 - MỚI]
    // Sinh viên chỉ được rút tối đa 5 lần trong 1 học kỳ trên toàn hệ thống
    private static final int MAX_WITHDRAW_PER_SEMESTER = 5;

    // [BR-R08 - MỚI]
    // Sau khi rút đơn khỏi 1 CLB, phải đợi 3 giờ mới được nộp lại CLB đó
    private static final long COOLDOWN_HOURS = 3;

    private final RecruitmentApplicationRepository recruitmentRepository;
    private final ClubMembershipRepository membershipRepository;
    private final ClubBlacklistRepository blacklistRepository;

    // [BR-R08 - MỚI]
    // Repository thao tác với bảng WithdrawLog để check quota + cooldown
    private final WithdrawLogRepository withdrawLogRepository;

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public RecruitmentApplicationResponseDTO applyForClub(
            ApplyClubRequestDTO request,
            Integer currentUserID,
            Integer currentSemesterID
    ) {

        // 1. Kiểm tra Blacklist (BR-B07/Validate 2)
        boolean isBlacklisted = blacklistRepository.existsByClubIDAndUserIDAndIsDeletedFalse(request.getClubID(), currentUserID);
        if (isBlacklisted) {
            throw new BusinessRuleException("Bạn nằm trong danh sách đen của CLB này, không thể nộp đơn.");
        }

        // =========================================================
        // [BR-R08 - MỚI]
        // Kiểm tra sinh viên có đơn active/có kết quả tại CLB này chưa
        // =========================================================
        /*
         * Mục đích:
         * - Chặn sinh viên tạo nhiều đơn vào cùng 1 CLB.
         * - Các trạng thái bị chặn:
         *      Submitted, Reviewing, Interviewing, Approved, Rejected.
         * - Draft và Withdrawn không tính là đơn active.
         */
        long blockingApplication = recruitmentRepository.countBlockingApplications(
                currentUserID,
                request.getClubID(),
                currentSemesterID
        );

        if (blockingApplication > 0) {
            throw new BusinessRuleException(
                    "Bạn đang có một đơn ứng tuyển đang hoạt động hoặc đã có kết quả tại CLB này, không thể tạo đơn mới."
            );
        }

        // =========================================================
        // [BR-R08 - MỚI]
        // Kiểm tra cooldown 3 giờ sau khi rút đơn khỏi cùng CLB
        // =========================================================
        /*
         * Mục đích:
         * - Sau khi sinh viên rút đơn khỏi CLB A,
         *   sinh viên phải đợi đủ 3 giờ mới được nộp lại CLB A.
         */
        withdrawLogRepository
                .findTopByStudentIDAndClubIDOrderByWithdrawnAtDesc(currentUserID, request.getClubID())
                .ifPresent(log -> {
                    long hours = Duration.between(
                            log.getWithdrawnAt(),
                            LocalDateTime.now()
                    ).toHours();

                    if (hours < COOLDOWN_HOURS) {
                        throw new BusinessRuleException(
                                "Bạn vừa rút đơn khỏi CLB này. Vui lòng đợi 3 giờ kể từ thời điểm rút đơn để có thể tạo và ứng tuyển lại."
                        );
                    }
                });

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

        // =========================================================
        // [BR-R08 - MỚI]
        // Đổi trạng thái tạo đơn từ Pending sang Submitted
        // =========================================================
        /*
         * Theo lifecycle mới:
         * - Draft: đơn nháp
         * - Submitted: đơn đã nộp
         * - Reviewing/Interviewing: CLB đang xử lý
         * - Approved/Rejected: đã có kết quả
         * - Withdrawn: đã rút
         *
         * Vì API này là nộp đơn thật nên status phải là Submitted.
         */
        application.setStatus("Submitted");

        application.setSubmittedAt(now);
        application.setCreatedAt(now);
        application.setIsDeleted(false);

        try {
            // =========================================================
            // [BR-R08 - MỚI]
            // Dùng saveAndFlush để DB unique index bắt lỗi trùng đơn ngay lập tức
            // =========================================================
            /*
             * Nếu spam nhiều request tạo đơn cùng lúc:
             * - Java validation có thể cùng lúc pass.
             * - Nhưng unique index ở SQL Server sẽ chặn request trùng.
             * - saveAndFlush giúp lỗi DB xảy ra ngay tại đây để catch được.
             */
            RecruitmentApplication savedEntity = recruitmentRepository.saveAndFlush(application);

            return mapToResponse(savedEntity);

        } catch (DataIntegrityViolationException ex) {
            // =========================================================
            // [BR-R08 - MỚI]
            // Bắt lỗi unique index khi spam/race condition tạo đơn
            // =========================================================
            throw new BusinessRuleException(
                    "Bạn đang có một đơn ứng tuyển đang hoạt động hoặc đã có kết quả tại CLB này, không thể tạo đơn mới."
            );
        }
    }

    // =========================================================
    // [BR-R08 - MỚI]
    // API rút đơn ứng tuyển
    // =========================================================
    /*
     * Flow xử lý:
     * 1. Lock đơn bằng PESSIMISTIC_WRITE ở Repository.
     * 2. Check quyền sở hữu.
     * 3. Check trạng thái đơn.
     * 4. Check quota tối đa 5 lần/kỳ.
     * 5. Chuyển status sang Withdrawn.
     * 6. Ghi WithdrawLog.
     */
    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public RecruitmentApplicationResponseDTO withdrawApplication(
            Integer applicationID,
            Integer currentUserID
    ) {
        RecruitmentApplication application = recruitmentRepository.findByIdForUpdate(applicationID)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy đơn ứng tuyển."));

        // [BR-R08 - MỚI]
        // Kiểm tra quyền sở hữu đơn
        if (!application.getUserID().equals(currentUserID)) {
            throw new BusinessRuleException("Bạn không có quyền rút đơn ứng tuyển này.");
        }

        String status = application.getStatus();

        // [BR-R08 - MỚI]
        // Draft thì xóa mềm, không ghi log, không cooldown, không trừ quota
        if ("Draft".equals(status)) {
            application.setIsDeleted(true);
            RecruitmentApplication savedEntity = recruitmentRepository.save(application);
            return mapToResponse(savedEntity);
        }

        // [BR-R08 - MỚI]
        // CLB đang xử lý hoặc phỏng vấn thì không cho sinh viên tự rút
        if ("Reviewing".equals(status) || "Interviewing".equals(status)) {
            throw new BusinessRuleException(
                    "CLB đang xử lý đơn hoặc lên lịch phỏng vấn, không thể tự rút đơn. Vui lòng liên hệ trực tiếp Admin CLB."
            );
        }

        // [BR-R08 - MỚI]
        // Đơn đã có kết quả chính thức thì không cho rút
        if ("Approved".equals(status) || "Rejected".equals(status)) {
            throw new BusinessRuleException(
                    "Đơn đã có kết quả tuyển dụng chính thức, không thể rút đơn."
            );
        }

        // [BR-R08 - MỚI]
        // Đơn đã rút trước đó thì không cho rút lại
        if ("Withdrawn".equals(status)) {
            throw new BusinessRuleException("Đơn này đã được rút từ trước.");
        }

        // [BR-R08 - MỚI]
        // Chỉ Submitted mới được rút
        if (!"Submitted".equals(status)) {
            throw new BusinessRuleException("Trạng thái đơn không hợp lệ để rút.");
        }

        // [BR-R08 - MỚI]
        // Đếm số lần rút đơn trong học kỳ hiện tại trên toàn hệ thống
        long withdrawCount = withdrawLogRepository.countByStudentIDAndSemesterID(
                currentUserID,
                application.getSemesterID()
        );

        if (withdrawCount >= MAX_WITHDRAW_PER_SEMESTER) {
            throw new BusinessRuleException(
                    "Bạn đã hết lượt rút đơn trong học kỳ này (Tối đa 5 lần/kỳ trên toàn hệ thống)."
            );
        }

        // [BR-R08 - MỚI]
        // Check phòng thủ: mỗi application chỉ được ghi WithdrawLog đúng 1 lần
        if (withdrawLogRepository.existsByApplicationID(applicationID)) {
            throw new BusinessRuleException("Đơn này đã được rút từ trước.");
        }

        LocalDateTime now = LocalDateTime.now();

        // [BR-R08 - MỚI]
        // Chuyển trạng thái sang Withdrawn để đóng băng đơn
        application.setStatus("Withdrawn");

        RecruitmentApplication savedEntity = recruitmentRepository.save(application);

        // [BR-R08 - MỚI]
        // Ghi log rút đơn để tính quota và cooldown
        WithdrawLog log = WithdrawLog.builder()
                .applicationID(savedEntity.getApplicationID())
                .studentID(savedEntity.getUserID())
                .clubID(savedEntity.getClubID())
                .semesterID(savedEntity.getSemesterID())
                .withdrawnAt(now)
                .build();

        withdrawLogRepository.save(log);

        return mapToResponse(savedEntity);
    }

    // =========================================================
    // [BR-R08 - MỚI]
    // Tách hàm map DTO để tránh lặp code
    // =========================================================
    /*
     * Trước đây phần map response nằm trực tiếp trong applyForClub.
     * Bây giờ tách ra để:
     * - applyForClub dùng lại được.
     * - withdrawApplication dùng lại được.
     * - Code gọn và dễ maintain hơn.
     */
    private RecruitmentApplicationResponseDTO mapToResponse(RecruitmentApplication savedEntity) {
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