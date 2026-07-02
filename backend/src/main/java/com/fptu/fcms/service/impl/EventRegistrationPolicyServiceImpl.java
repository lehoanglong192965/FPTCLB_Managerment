package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventRegistrationPolicyRequest;
import com.fptu.fcms.dto.response.EventRegistrationPolicyResponse;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistrationPolicy;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.EventRegistrationPolicyRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventRegistrationPolicyService;
import com.fptu.fcms.service.OTPService;
import com.fptu.fcms.service.event.EventProposalValidator;
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventRegistrationPolicyServiceImpl implements EventRegistrationPolicyService {

    private static final Set<String> ALLOWED_TYPES = Set.copyOf(RegistrationLifecycle.PARTICIPANT_TYPES);

    private final EventRepository eventRepository;
    private final EventRegistrationPolicyRepository policyRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;
    private final EventPermissionService permissionService;
    private final OTPService otpService;
    private final EventProposalValidator proposalValidator;

    @Override
    public List<EventRegistrationPolicyResponse> getPolicies(Integer eventId, UserPrincipal currentUser) {
        ensureCanView(eventId, currentUser);
        return policyRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void syncPolicies(Integer eventId, List<EventRegistrationPolicyRequest> requests, LocalDateTime now) {
        if (requests == null || requests.isEmpty()) {
            return;
        }
        List<EventRegistrationPolicyRequest> normalized = normalizeAndValidateRequests(requests);

        Map<String, EventRegistrationPolicy> existingByType = policyRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .collect(Collectors.toMap(
                        p -> p.getParticipantType().toUpperCase(Locale.ROOT),
                        p -> p,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        List<EventRegistrationPolicy> toSave = new ArrayList<>();
        for (EventRegistrationPolicyRequest request : normalized) {
            String type = request.getParticipantType().name();
            EventRegistrationPolicy policy = existingByType.getOrDefault(type, new EventRegistrationPolicy());
            policy.setEventID(eventId);
            policy.setParticipantType(type);
            policy.setIsEnabled(request.getIsEnabled() == null ? Boolean.TRUE : request.getIsEnabled());
            policy.setQuota(request.getQuota());
            policy.setWaitlistEnabled(request.getWaitlistEnabled() != null && request.getWaitlistEnabled());
            policy.setQuotaReleaseAt(request.getQuotaReleaseAt());
            policy.setRequiresManualApproval(request.getRequiresManualApproval() != null && request.getRequiresManualApproval());
            policy.setRequiresApproval(policy.getRequiresManualApproval());
            policy.setCreatedAt(policy.getCreatedAt() == null ? now : policy.getCreatedAt());
            policy.setIsDeleted(false);
            toSave.add(policy);
        }
        policyRepository.saveAll(toSave);
    }

    @Override
    public void validateBeforeSubmit(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));
        List<EventRegistrationPolicy> policies = policyRepository.findByEventIDAndIsDeletedFalse(eventId);
        proposalValidator.validate(event, policies);
    }

    @Override
    public List<EventRegistrationPolicy> buildDefaultPolicies(Integer eventId, LocalDateTime now) {
        return RegistrationLifecycle.PARTICIPANT_TYPES.stream()
                .map(type -> {
                    EventRegistrationPolicy policy = new EventRegistrationPolicy();
                    policy.setEventID(eventId);
                    policy.setParticipantType(type);
                    policy.setIsEnabled(Boolean.TRUE);
                    policy.setQuota(null);
                    policy.setWaitlistEnabled(Boolean.FALSE);
                    policy.setQuotaReleaseAt(null);
                    policy.setRequiresManualApproval(RegistrationLifecycle.PARTICIPANT_TYPE_PARTICIPANT.equals(type));
                    policy.setRequiresApproval(policy.getRequiresManualApproval());
                    policy.setCreatedAt(now);
                    policy.setIsDeleted(false);
                    return policy;
                })
                .collect(Collectors.toList());
    }

    private void ensureCanView(Integer eventId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new BusinessRuleException("Bạn cần đăng nhập để xem cấu hình.", HttpStatus.FORBIDDEN);
        }
        if (permissionService.isIcpdp(currentUser)) {
            return;
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));
        Semester semester = semesterRepository.findBySemesterIDAndIsDeletedFalse(event.getSemesterID())
                .orElseThrow(() -> new BusinessRuleException("Semester not found.", HttpStatus.NOT_FOUND));
        List<Integer> boardRoleIds = List.of("Leader", "ViceLeader").stream()
                .map(roleName -> clubRoleRepository.findByRoleNameAndIsDeletedFalse(roleName)
                        .map(role -> role.getClubRoleID())
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (boardRoleIds.isEmpty()) {
            throw new BusinessRuleException("Leader role is not configured.", HttpStatus.FORBIDDEN);
        }

        boolean isBoardMember = boardRoleIds.stream().anyMatch(roleId ->
                clubMembershipRepository.existsByClubIDAndUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                        event.getClubID(),
                        currentUser.getUserId(),
                        semester.getSemesterID(),
                        roleId
                )
        );
        if (!isBoardMember) {
            throw new BusinessRuleException("You do not have permission to view this configuration.", HttpStatus.FORBIDDEN);
        }
    }

    private List<EventRegistrationPolicyRequest> normalizeAndValidateRequests(List<EventRegistrationPolicyRequest> requests) {
        if (requests.size() != 3) {
            throw new BusinessRuleException("Exactly 3 policy rows are required.", HttpStatus.BAD_REQUEST);
        }

        Map<String, EventRegistrationPolicyRequest> unique = new LinkedHashMap<>();
        for (EventRegistrationPolicyRequest request : requests) {
            if (request == null || request.getParticipantType() == null) {
                throw new BusinessRuleException("participantType is required.", HttpStatus.BAD_REQUEST);
            }
            String type = request.getParticipantType().name();
            if (!ALLOWED_TYPES.contains(type)) {
                throw new BusinessRuleException("Invalid participantType: " + request.getParticipantType(), HttpStatus.BAD_REQUEST);
            }
            if (request.getQuota() != null && request.getQuota() < 0) {
                throw new BusinessRuleException("quota must be >= 0.", HttpStatus.BAD_REQUEST);
            }
            if (unique.putIfAbsent(type, request) != null) {
                throw new BusinessRuleException("Duplicate participantType: " + type, HttpStatus.BAD_REQUEST);
            }
        }

        if (unique.size() != 3) {
            throw new BusinessRuleException("All 3 participant types must be present.", HttpStatus.BAD_REQUEST);
        }

        return new ArrayList<>(unique.values());
    }

    private EventRegistrationPolicyResponse toResponse(EventRegistrationPolicy policy) {
        return new EventRegistrationPolicyResponse(
                policy.getPolicyID(),
                policy.getEventID(),
                policy.getParticipantType(),
                policy.getIsEnabled(),
                policy.getQuota(),
                policy.getWaitlistEnabled(),
                policy.getQuotaReleaseAt(),
                policy.getRequiresManualApproval(),
                policy.getRequiresApproval(),
                policy.getCreatedAt()
        );
    }
}
