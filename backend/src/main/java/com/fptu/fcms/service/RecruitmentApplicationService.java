package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplyClubRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentApplicationResponseDTO;

public interface RecruitmentApplicationService {

    RecruitmentApplicationResponseDTO applyForClub(
            ApplyClubRequestDTO request,
            Integer currentUserID,
            Integer currentSemesterID
    );

    // =========================================================
    // [BR-R08 - MỚI]
    // API rút đơn ứng tuyển
    // =========================================================
    RecruitmentApplicationResponseDTO withdrawApplication(
            Integer applicationID,
            Integer currentUserID
    );
}