package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.MemberRankingDTO;

import java.util.List;

public interface MemberRankingService {
    List<MemberRankingDTO> getMemberRankings(Integer clubId, Integer requesterUserId);
}
