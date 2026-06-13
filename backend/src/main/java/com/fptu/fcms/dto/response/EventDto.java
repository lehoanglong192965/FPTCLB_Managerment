package com.fptu.fcms.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class EventDto {
    private Integer eventID;
    private Integer clubID;
    private Integer semesterID;
    private String eventCode;
    private String eventName;
    private String description;
    private String location;
    private BigDecimal budget;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String eventStatus;
    private LocalDateTime createdAt;
}
