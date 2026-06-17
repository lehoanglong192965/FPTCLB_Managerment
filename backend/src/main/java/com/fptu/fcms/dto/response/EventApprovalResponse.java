package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventApprovalResponse {
    private Integer eventId;
    private String eventName;
    private String status;
    private String pdpFeedback;
    private String message;
}
