package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateEventProposalRequest {
    @NotNull
    private Integer clubID;
    @NotNull
    private Integer semesterID;
    @NotBlank
    private String eventCode;
    @NotBlank
    @Size(min = 5, max = 150)
    private String eventName;
    private String description;
    @NotBlank
    private String location;
    @NotNull
    private BigDecimal budget;
    private Integer maxParticipants;
    private Integer totalCapacity;
    private Boolean allowWalkIn;
    private LocalDateTime registrationOpenAt;
    private LocalDateTime registrationCloseAt;
    private LocalDateTime checkInOpenAt;
    private LocalDateTime checkInCloseAt;
    @NotNull
    private LocalDateTime startDate;
    @NotNull
    private LocalDateTime endDate;
    private Boolean isResubmitted;
    private Boolean isInternal;
    private List<EventAssignmentDto> assignments;
    @Valid
    private List<EventRegistrationPolicyRequest> registrationPolicies;
    private String bannerUrl;
}
