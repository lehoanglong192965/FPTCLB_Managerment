package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateNotificationRequest;
import com.fptu.fcms.dto.response.MyNotificationResponse;
import com.fptu.fcms.dto.response.NotificationPageResponse;
import com.fptu.fcms.dto.response.NotificationResponse;
import com.fptu.fcms.dto.response.UnreadNotificationCountResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface ClubNotificationService {
    NotificationResponse createNotification(
            Integer clubId,
            CreateNotificationRequest request,
            UserPrincipal currentUser
    );

    NotificationPageResponse getMyNotifications(
            UserPrincipal currentUser,
            String keyword,
            int page,
            int size
    );

    MyNotificationResponse getNotificationDetail(Integer notificationId, UserPrincipal currentUser);

    MyNotificationResponse markAsRead(Integer notificationId, UserPrincipal currentUser);

    UnreadNotificationCountResponse getUnreadCount(UserPrincipal currentUser);
}