package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.AppealCreateRequest;
import com.fptu.fcms.dto.request.AppealResolveRequest;
import com.fptu.fcms.dto.response.AppealResponse;
import com.fptu.fcms.dto.response.ContributionBatchResponse;
import com.fptu.fcms.dto.response.ContributionDTO;

import java.util.List;

public interface ContributionBatchService {
    ContributionBatchResponse approveReportAndCreateBatch(Integer eventId, Integer actorId);

    ContributionBatchResponse getBatchByEvent(Integer eventId);

    List<ContributionDTO> getContributionScores(Integer eventId);

    ContributionBatchResponse saveContributionScores(Integer eventId, List<ContributionDTO> contributions, Integer actorId);

    ContributionBatchResponse openAppealWindow(Integer eventId, Integer actorId);

    AppealResponse createAppeal(Integer batchId, AppealCreateRequest request, Integer userId);

    List<AppealResponse> getAppeals(Integer batchId);

    AppealResponse resolveAppeal(Integer appealId, AppealResolveRequest request, Integer actorId);

    ContributionBatchResponse finalizeBatch(Integer eventId, Integer actorId);
}
