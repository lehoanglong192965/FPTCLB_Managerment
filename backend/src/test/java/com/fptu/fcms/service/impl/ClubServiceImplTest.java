package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.ClubManagementSummaryDTO;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClubServiceImplTest {

    @Mock
    private ClubRepository clubRepository;

    @Mock
    private ClubMembershipRepository clubMembershipRepository;

    @InjectMocks
    private ClubServiceImpl service;

    @Test
    void getAllClubsForManagementReturnsEveryStatusInRepositoryOrderWithoutMembershipQueries() {
        Club inactiveClub = club(2, "Alpha Club", "Inactive");
        Club activeClub = club(1, "Beta Club", "Active");
        when(clubRepository.findByIsDeletedFalseOrderByClubNameAsc())
                .thenReturn(List.of(inactiveClub, activeClub));

        List<ClubManagementSummaryDTO> result = service.getAllClubsForManagement();

        assertThat(result).containsExactly(
                new ClubManagementSummaryDTO(2, "Alpha Club", "Inactive"),
                new ClubManagementSummaryDTO(1, "Beta Club", "Active")
        );
        verify(clubRepository).findByIsDeletedFalseOrderByClubNameAsc();
        verify(clubRepository, never()).findByClubStatusAndIsDeletedFalse(anyString());
        verifyNoInteractions(clubMembershipRepository);
    }

    private Club club(Integer clubID, String name, String status) {
        Club club = new Club();
        club.setClubID(clubID);
        club.setClubName(name);
        club.setClubStatus(status);
        club.setIsDeleted(false);
        return club;
    }
}
