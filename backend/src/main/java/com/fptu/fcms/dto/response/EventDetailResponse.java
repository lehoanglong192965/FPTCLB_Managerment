package com.fptu.fcms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Event detail response")
public class EventDetailResponse {
    private final Integer eventID;
    private final Integer clubID;
    private final Integer semesterID;
    private final String eventCode;
    private final String eventName;
    private final String description;
    private final String location;
    private final LocalDateTime startDate;
    private final LocalDateTime endDate;
    private final String eventStatus;
    private final String bannerUrl;
    private final Boolean allowWalkIn;
    private final LocalDateTime registrationOpenAt;
    private final LocalDateTime registrationCloseAt;
    private final LocalDateTime checkInOpenAt;
    private final LocalDateTime checkInCloseAt;
    private final Integer totalCapacity;
    private final Integer maxParticipants;
    private final BigDecimal budget;
    private final Integer approvedBy;
    private final LocalDateTime approvedAt;
    private final String pdpFeedback;
    private final String rejectionReason;
    private final Boolean isInternal;
    private final Boolean isScoreLocked;
    private final LocalDateTime createdAt;
    private final Integer createdBy;
    private final List<EventRegistrationPolicyResponse> registrationPolicies;
}
