package com.fptu.fcms.entity;

import com.fptu.fcms.enums.ParticipantType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Check(constraints = "participantType in ('CORE_TEAM', 'SUPPORT_ORGANIZER', 'PARTICIPANT')")
@Table(
        name = "EventRegistrationPolicy",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_EventRegistrationPolicy_Event_ParticipantType",
                columnNames = {"eventID", "participantType"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistrationPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "policyID")
    private Integer policyID;

    @Column(name = "eventID", nullable = false)
    private Integer eventID;

    @Column(name = "participantType", nullable = false, length = 50)
    @Convert(converter = ParticipantTypeConverter.class)
    private ParticipantType participantType;

    @Column(name = "isEnabled", nullable = false)
    private Boolean isEnabled = true;

    @Column(name = "quota")
    private Integer quota;

    @Column(name = "waitlistEnabled", nullable = false)
    private Boolean waitlistEnabled = false;

    @Column(name = "quotaReleaseAt")
    private LocalDateTime quotaReleaseAt;

    @Column(name = "requiresApproval", nullable = false)
    private Boolean requiresApproval = false;

    @Column(name = "requiresManualApproval", nullable = false)
    private Boolean requiresManualApproval = false;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;

    @PrePersist
    @PreUpdate
    private void normalizeLifecycle() {
        if (isEnabled == null) {
            isEnabled = true;
        }
        if (waitlistEnabled == null) {
            waitlistEnabled = false;
        }
        if (requiresManualApproval == null) {
            requiresManualApproval = false;
        }
        if (requiresApproval == null) {
            requiresApproval = requiresManualApproval;
        }
        if (quota != null && quota < 0) {
            throw new IllegalArgumentException("quota cannot be negative.");
        }
    }
}
