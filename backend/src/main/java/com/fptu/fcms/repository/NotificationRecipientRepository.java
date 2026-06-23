package com.fptu.fcms.repository;

import com.fptu.fcms.entity.NotificationRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Integer> {

    @Query(value = "SELECT nr FROM NotificationRecipient nr " +
            "JOIN nr.notification n " +
            "JOIN n.club c " +
            "WHERE nr.user.userID = :userID " +
            "AND n.isDeleted = false " +
            "AND (:keyword IS NULL OR :keyword = '' " +
            "OR LOWER(COALESCE(n.title, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(COALESCE(n.notificationType, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.clubName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY n.createdAt DESC",
            countQuery = "SELECT COUNT(nr) FROM NotificationRecipient nr " +
                    "JOIN nr.notification n " +
                    "JOIN n.club c " +
                    "WHERE nr.user.userID = :userID " +
                    "AND n.isDeleted = false " +
                    "AND (:keyword IS NULL OR :keyword = '' " +
                    "OR LOWER(COALESCE(n.title, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR LOWER(COALESCE(n.notificationType, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR LOWER(c.clubName) LIKE LOWER(CONCAT('%', :keyword, '%')))" )
    Page<NotificationRecipient> findMyNotifications(
            @Param("userID") Integer userID,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("SELECT nr FROM NotificationRecipient nr " +
            "JOIN FETCH nr.notification n " +
            "JOIN FETCH n.club c " +
            "JOIN FETCH n.createdBy creator " +
            "WHERE n.notificationID = :notificationID " +
            "AND nr.user.userID = :userID " +
            "AND n.isDeleted = false")
    Optional<NotificationRecipient> findByNotificationIdAndUserId(
            @Param("notificationID") Integer notificationID,
            @Param("userID") Integer userID
    );

    @Query("SELECT COUNT(nr) FROM NotificationRecipient nr " +
            "JOIN nr.notification n " +
            "WHERE nr.user.userID = :userID " +
            "AND nr.isRead = false " +
            "AND n.isDeleted = false")
    long countUnreadByUserId(@Param("userID") Integer userID);
}