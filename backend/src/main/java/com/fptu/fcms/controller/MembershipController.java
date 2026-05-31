package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.MembershipUpdateRequest;
import com.fptu.fcms.dto.response.ClubLeadershipResponse;
import com.fptu.fcms.dto.response.LeadershipChangeResponse;
import com.fptu.fcms.service.ClubMembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller — Quản lý Ban điều hành CLB.
 *
 * PUT  /api/v1/memberships/leadership          → Bổ nhiệm / Bãi nhiệm
 * GET  /api/v1/memberships/leadership/{clubID} → Xem Ban điều hành hiện tại
 *
 * Header X-Actor-ID: userID của người thực hiện (ICPDP staff).
 * Trong production nên lấy từ JWT SecurityContext thay vì header thủ công.
 */
@RestController
@RequestMapping("/api/v1/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final ClubMembershipService membershipService;

    /**
     * Thay đổi Ban điều hành CLB (Bổ nhiệm / Bãi nhiệm Leader).
     *
     * Kiểm tra tự động trong service:
     *  [BR-ICPDP] Actor phải là tài khoản ICPDP              → 403
     *  [BR-L01]   Chặn sinh viên đang bị kỷ luật Active      → 403
     *  [BR-L02]   Bổ nhiệm Leader mới → tự bãi nhiệm cũ (atomic)
     */
    @PutMapping("/leadership")
    public ResponseEntity<LeadershipChangeResponse> changeLeadership(
            @RequestHeader("X-Actor-ID") Integer actorID,
            @Valid @RequestBody MembershipUpdateRequest request) {

        LeadershipChangeResponse response = membershipService.changeLeadership(request, actorID);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách Ban điều hành hiện tại của CLB trong học kỳ đang active.
     */
    @GetMapping("/leadership/{clubID}")
    public ResponseEntity<ClubLeadershipResponse> getCurrentLeadership(
            @PathVariable Integer clubID) {

        ClubLeadershipResponse response = membershipService.getCurrentLeadership(clubID);
        return ResponseEntity.ok(response);
    }
}
