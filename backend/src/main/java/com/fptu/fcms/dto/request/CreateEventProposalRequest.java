package com.fptu.fcms.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateEventProposalRequest {
    private Integer clubID;
    private Integer semesterID;
    private String eventCode;
    private String eventName;
    private String description;
    private String location;
    private BigDecimal budget;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isResubmitted;
    private Boolean isInternal;
    private List<EventAssignmentDto> assignments;
}
