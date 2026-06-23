package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplyClubRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentApplicationResponseDTO;

import java.util.List;

public interface RecruitmentApplicationService {

    RecruitmentApplicationResponseDTO applyForClub(
            ApplyClubRequestDTO request,
            Integer currentUserID,
            Integer currentSemesterID
    );

    RecruitmentApplicationResponseDTO withdrawApplication(
            Integer applicationID,
            Integer currentUserID
    );

    List<RecruitmentApplicationResponseDTO> getMyApplications(Integer userID);
}