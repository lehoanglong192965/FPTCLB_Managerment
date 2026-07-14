package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.MemberRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class MemberRankingController {

    private final MemberRankingService memberRankingService;

    // Service kiểm tra user phải là active member của chính CLB trước khi đọc cache BXH.
    @GetMapping("/{clubId}/rankings/members")
    public ResponseEntity<List<MemberRankingDTO>> getMemberRankings(
            @PathVariable Integer clubId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        memberRankingService.validateActiveClubMember(clubId, currentUser);
        return ResponseEntity.ok(memberRankingService.getMemberRankings(clubId));
    }
}