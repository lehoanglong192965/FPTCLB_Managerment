package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EventApprovalResponse {
    private Integer eventId;
    private String eventName;
    private EventStatus status;
    private String pdpFeedback;
    private String message;
}
