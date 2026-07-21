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
    private String venueName;
    private String location;
    private String locationDetail;
    private Double latitude;
    private Double longitude;
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
    private Boolean isPaidEvent;
    private BigDecimal ticketPrice;
    private String ticketCurrency;
    private String bannerUrl;
    private String bannerPublicId;
    @Valid
    private List<EventRegistrationPolicyRequest> registrationPolicies;
}
