package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplicationReviewRequest;
import com.fptu.fcms.dto.request.InterviewGradingRequest;
import com.fptu.fcms.dto.response.RecruitmentDecisionResponse;

public interface RecruitmentReviewService {

    RecruitmentDecisionResponse reviewApplication(
            ApplicationReviewRequest request,
            Integer actorID
    );

    RecruitmentDecisionResponse gradeInterview(
            InterviewGradingRequest request,
            Integer actorID
    );
}
