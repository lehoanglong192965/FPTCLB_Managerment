package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface MemberRankingService {
    void validateActiveClubMember(Integer clubId, UserPrincipal currentUser);
    void validateClubMember(Integer clubId, Integer semesterId, UserPrincipal currentUser);
    List<MemberRankingDTO> getMemberRankings(Integer clubId);
    List<MemberRankingDTO> getMemberRankings(Integer clubId, Integer semesterId);
}
