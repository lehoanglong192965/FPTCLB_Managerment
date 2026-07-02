package com.fptu.fcms.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import jakarta.validation.Valid;

@Data
public class UpdateEventRequest {
    private String eventName;
    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer maxParticipants;
    private Integer totalCapacity;
    private Boolean allowWalkIn;
    private LocalDateTime registrationOpenAt;
    private LocalDateTime registrationCloseAt;
    private LocalDateTime checkInOpenAt;
    private LocalDateTime checkInCloseAt;
    private BigDecimal budget;
    private String bannerUrl;
    @Valid
    private List<EventRegistrationPolicyRequest> registrationPolicies;
}
