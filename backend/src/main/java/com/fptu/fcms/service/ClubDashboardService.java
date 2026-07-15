package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubEvaluationRequest;
import com.fptu.fcms.dto.response.ClubDashboardResponse;
import com.fptu.fcms.dto.response.ClubEvaluationResponse;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface ClubDashboardService {
    ClubDashboardResponse getDashboard(Integer clubId, Integer semesterId, UserPrincipal currentUser);

    List<ClubDashboardResponse.DashboardWarning> getWarnings(Integer clubId, Integer semesterId, UserPrincipal currentUser);

    List<ClubEvaluationResponse> getEvaluations(Integer clubId, Integer semesterId, UserPrincipal currentUser);

    ClubEvaluationResponse createEvaluation(Integer clubId, ClubEvaluationRequest request, UserPrincipal currentUser);

    ClubEvaluationResponse updateEvaluation(Integer clubId, Integer evaluationId, ClubEvaluationRequest request, UserPrincipal currentUser);
}
