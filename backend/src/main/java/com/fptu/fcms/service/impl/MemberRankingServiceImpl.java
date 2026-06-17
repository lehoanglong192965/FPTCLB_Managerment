package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.service.MemberRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberRankingServiceImpl implements MemberRankingService {

    private final ClubRepository clubRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final MemberRankingCacheService memberRankingCacheService;

    @Override
    @Transactional(readOnly = true)
    public List<MemberRankingDTO> getMemberRankings(Integer clubId, Integer requesterUserId) {
        validateClubExists(clubId);
        validateRequesterIsClubMember(clubId, requesterUserId);

        return memberRankingCacheService.getCachedMemberRankings(clubId);
    }

    private void validateClubExists(Integer clubId) {
        if (!clubRepository.existsById(clubId)) {
            throw new BusinessRuleException(
                    "Không tìm thấy CLB.",
                    HttpStatus.NOT_FOUND
            );
        }
    }

    private void validateRequesterIsClubMember(Integer clubId, Integer requesterUserId) {
        boolean isClubMember = clubMembershipRepository.existsByClubIDAndUserIDAndIsDeletedFalse(
                clubId,
                requesterUserId
        );

        if (!isClubMember) {
            throw new BusinessRuleException(
                    "Chỉ thành viên hoặc Leader của CLB này mới được xem bảng xếp hạng thành viên.",
                    HttpStatus.FORBIDDEN
            );
        }
    }
}
