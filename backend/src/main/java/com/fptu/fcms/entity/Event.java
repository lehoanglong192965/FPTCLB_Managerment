package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import com.fptu.fcms.enums.EventStatus;

import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "Event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "eventCode")
    private String eventCode;

    @org.hibernate.annotations.Nationalized
    @Column(name = "eventName")
    private String eventName;

    @org.hibernate.annotations.Nationalized
    @Column(name = "description")
    private String description;

    @org.hibernate.annotations.Nationalized
    @Column(name = "location")
    private String location;

    @Column(name = "budget")
    private BigDecimal budget;

    @Column(name = "maxParticipants")
    private Integer maxParticipants;

    @Column(name = "totalCapacity")
    private Integer totalCapacity;

    /**
     * Số chỗ đã giữ (member + guest, theo CONFIRMED_STATUSES) — không lưu DB,
     * được EventService gắn vào trước khi trả về API để FE hiển thị "x/y đã đăng ký".
     */
    @Transient
    private Long currentParticipants;

    @Column(name = "allowWalkIn")
    private Boolean allowWalkIn = false;

    @Column(name = "registrationOpenAt")
    private LocalDateTime registrationOpenAt;

    @Column(name = "registrationCloseAt")
    private LocalDateTime registrationCloseAt;

    @Column(name = "checkInOpenAt")
    private LocalDateTime checkInOpenAt;

    @Column(name = "checkInCloseAt")
    private LocalDateTime checkInCloseAt;

    @Column(name = "feedbackEnabled")
    private Boolean feedbackEnabled = true;

    @Column(name = "feedbackOpensAt")
    private LocalDateTime feedbackOpensAt;

    @Column(name = "feedbackClosesAt")
    private LocalDateTime feedbackClosesAt;

    @Column(name = "startDate")
    private LocalDateTime startDate;

    @Column(name = "endDate")
    private LocalDateTime endDate;

    @Column(name = "eventStatus")
    @Convert(converter = EventStatusConverter.class)
    private EventStatus eventStatus;

    // Thêm phương thức helper để kiểm tra trạng thái
    public boolean isEditable() {
        return EventStatus.DRAFT.equals(this.eventStatus) || EventStatus.PENDING.equals(this.eventStatus);
    }

    public boolean isReportable() {
        return EventStatus.COMPLETED.equals(this.eventStatus);
    }

    @org.hibernate.annotations.Nationalized
    @Column(name = "pdpFeedback")
    private String pdpFeedback;

    @Column(name = "approvedBy")
    private Integer approvedBy;

    @Column(name = "approvedAt")
    private LocalDateTime approvedAt;


    @Column(name = "rejectionReason", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionReason;

    @Column(name = "isResubmitted")
    private Boolean isResubmitted;

    @Column(name = "isInternal")
    private Boolean isInternal;

    @Column(name = "isScoreLocked")
    private Boolean isScoreLocked;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "bannerUrl", columnDefinition = "NVARCHAR(MAX)")
    private String bannerUrl;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

    @PrePersist
    @PreUpdate
    private void normalizeAndValidate() {
        if (totalCapacity == null && maxParticipants != null) {
            totalCapacity = maxParticipants;
        } else if (maxParticipants == null && totalCapacity != null) {
            maxParticipants = totalCapacity;
        }

        if (totalCapacity != null && totalCapacity < 0) {
            throw new IllegalArgumentException("totalCapacity cannot be negative.");
        }
        if (maxParticipants != null && maxParticipants < 0) {
            throw new IllegalArgumentException("maxParticipants cannot be negative.");
        }
        if (registrationOpenAt != null && registrationCloseAt != null && !registrationOpenAt.isBefore(registrationCloseAt)) {
            throw new IllegalArgumentException("registrationOpenAt must be before registrationCloseAt.");
        }
        if (checkInOpenAt != null && checkInCloseAt != null && !checkInOpenAt.isBefore(checkInCloseAt)) {
            throw new IllegalArgumentException("checkInOpenAt must be before checkInCloseAt.");
        }
        if (allowWalkIn == null) {
            allowWalkIn = false;
        }
        if (feedbackEnabled == null) {
            feedbackEnabled = true;
        }
    }

}