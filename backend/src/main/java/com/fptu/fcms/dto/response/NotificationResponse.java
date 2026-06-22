package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class NotificationResponse {
    private Integer notificationID;
    private Integer clubID;
    private String title;
    private String notificationType;
    private String content;
    private Integer createdByUserID;
    private LocalDateTime createdAt;
    private Integer recipientCount;
    private String message;
}