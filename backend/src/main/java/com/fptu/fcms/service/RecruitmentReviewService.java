package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplicationReviewRequest;
import com.fptu.fcms.dto.request.InterviewGradingRequest;
import com.fptu.fcms.dto.response.ClubApplicationSummaryResponse;
import com.fptu.fcms.dto.response.RecruitmentDecisionResponse;

import java.util.List;

public interface RecruitmentReviewService {

    List<ClubApplicationSummaryResponse> getClubApplications(Integer clubId);

    RecruitmentDecisionResponse reviewApplication(
            ApplicationReviewRequest request,
            Integer actorID
    );

    RecruitmentDecisionResponse gradeInterview(
            InterviewGradingRequest request,
            Integer actorID
    );
}
