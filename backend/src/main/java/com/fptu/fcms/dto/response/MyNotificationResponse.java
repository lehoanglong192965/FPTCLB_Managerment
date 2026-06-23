package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MyNotificationResponse {
    private Integer notificationID;
    private Integer recipientID;
    private Integer clubID;
    private String clubName;
    private String title;
    private String notificationType;
    private String content;
    private Integer createdByUserID;
    private String createdByFullName;
    private LocalDateTime createdAt;
    private Boolean isRead;
    private LocalDateTime readAt;
}