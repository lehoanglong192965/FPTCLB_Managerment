package com.fptu.fcms.membership.service;

import com.fptu.fcms.membership.dto.RecruitmentSubmitResponse;

public interface RecruitmentService {
    
    /**
     * Submits a recruitment application for a specific user.
     */
    RecruitmentSubmitResponse submitApplication(Long applicationId, Long userId);
}
