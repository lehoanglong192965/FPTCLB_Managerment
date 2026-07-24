package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.PaymentMethod;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class RegistrationListItemResponse {
    private Integer registrationID;
    private Integer guestRegistrationID;
    private Integer eventID;
    private Integer userID;
    private ParticipantType participantType;
    private RegistrationStatus status;
    private LocalDateTime registeredAt;
    private String studentId;
    private String fullName;
    private String email;
    private String guestFullName;
    private String guestEmail;
    private String guestPhone;
    private Boolean capacityExempt;
    private PaymentStatus paymentStatus;
    private BigDecimal amountDue;
    private String paymentCurrency;
    private String paymentReference;
    private PaymentMethod paymentMethod;
    private LocalDateTime paymentSubmittedAt;
}
