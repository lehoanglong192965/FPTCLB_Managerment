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
import org.springframework.web.bind.annotation.RequestParam;
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
            @RequestParam(required = false) Integer semesterId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (semesterId == null) {
            memberRankingService.validateActiveClubMember(clubId, currentUser);
            return ResponseEntity.ok(memberRankingService.getMemberRankings(clubId));
        }
        memberRankingService.validateClubMember(clubId, semesterId, currentUser);
        return ResponseEntity.ok(memberRankingService.getMemberRankings(clubId, semesterId));
    }
}
