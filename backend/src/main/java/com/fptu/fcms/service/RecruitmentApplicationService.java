package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplyClubRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentApplicationResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface RecruitmentApplicationService {

    /** Upload file CV (PDF) trước khi nộp đơn — trả về url để gắn vào cvUrl. */
    Map<String, String> uploadCv(MultipartFile file);

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