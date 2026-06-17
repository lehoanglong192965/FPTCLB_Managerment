package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;

public interface EventApprovalService {
    EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, Integer actorID);
}
