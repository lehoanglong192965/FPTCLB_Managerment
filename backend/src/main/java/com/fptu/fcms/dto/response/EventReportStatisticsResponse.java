package com.fptu.fcms.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class EventReportStatisticsResponse {
    private Integer eventId;
    private String eventName;
    private Boolean internalEvent;
    private Boolean paidEvent;
    private Integer maximumParticipants;
    private BigDecimal plannedBudget;

    private long totalRegistrations;
    private long confirmedRegistrations;
    private long cancelledRegistrations;
    private long fptuRegistrations;
    private long guestRegistrations;
    private long pendingPaymentCount;
    private long paidTicketCount;
    private BigDecimal revenue;
    private String currency;

    private int attendanceSessionCount;
    private boolean attendanceSessionsClosed;
    private long presentParticipants;
    private long absentParticipants;
    private long walkInParticipants;
    private BigDecimal attendanceRate;

    private long feedbackCount;
    private BigDecimal averageOverallRating;
    private BigDecimal feedbackResponseRate;
    private LocalDateTime calculatedAt;
}
