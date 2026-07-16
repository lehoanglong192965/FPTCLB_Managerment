package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.PersonnelReassignRequest;
import com.fptu.fcms.entity.PersonnelReassignLog;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.PersonnelReassignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * API điều động nhân sự khẩn cấp dành cho IC-PDP.
 * Base path: /api/icpdp/personnel-reassign
 */
@RestController
@RequestMapping("/api/icpdp/personnel-reassign")
@Tag(name = "ICPDP Personnel Reassign", description = "API điều động Trưởng/Phó Trưởng CLB khẩn cấp và lịch sử")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class ICPDPPersonnelReassignController {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PersonnelReassignService personnelReassignService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ICPDP', 'Admin')")
    @Operation(summary = "Điều động khẩn cấp Trưởng/Phó Trưởng CLB")
    public ResponseEntity<Map<String, Object>> reassign(
            @Valid @RequestBody PersonnelReassignRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PersonnelReassignLog log = personnelReassignService.reassign(request, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(log));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ICPDP', 'Admin')")
    @Operation(summary = "Lịch sử điều động nhân sự")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        List<Map<String, Object>> history = personnelReassignService.getHistory().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(history);
    }

    /** Map entity → JSON đúng key mà trang IcpdpPersonnelReassign.jsx sử dụng. */
    private Map<String, Object> toResponse(PersonnelReassignLog log) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", log.getLogID());
        m.put("date", log.getCreatedAt() != null ? log.getCreatedAt().format(DATE_FMT) : "");
        m.put("clubName", log.getClubName());
        m.put("action", "leader".equals(log.getPosition()) ? "replace_leader" : "replace_vice");
        m.put("position", log.getPosition());
        m.put("level", log.getLevel());
        m.put("fromName", log.getFromName() != null ? log.getFromName() : "—");
        m.put("toName", log.getToName());
        m.put("reason", log.getReason());
        m.put("by", log.getActorName());
        m.put("status", "completed");
        return m;
    }
}