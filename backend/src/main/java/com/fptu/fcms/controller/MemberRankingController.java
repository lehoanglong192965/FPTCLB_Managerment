package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.MemberRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs/{clubId}/rankings/members")
@Tag(name = "Member Rankings", description = "API bảng xếp hạng thành viên CLB")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class MemberRankingController {

    private final MemberRankingService memberRankingService;

    @GetMapping
    @Operation(summary = "Lấy bảng xếp hạng thành viên của CLB")
    public ResponseEntity<List<MemberRankingDTO>> getMemberRankings(
            @PathVariable Integer clubId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(memberRankingService.getMemberRankings(clubId, currentUser.getUserId()));
    }
}
