package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.RecruitmentCycleRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentCycleResponseDTO;

import java.util.List;
import com.fptu.fcms.security.UserPrincipal;

public interface RecruitmentCycleService {
    RecruitmentCycleResponseDTO createCycle(RecruitmentCycleRequestDTO dto);
    RecruitmentCycleResponseDTO updateCycle(Integer id, RecruitmentCycleRequestDTO dto);
    RecruitmentCycleResponseDTO getCycleById(Integer id);
    List<RecruitmentCycleResponseDTO> getAllCycles();
    void softDeleteCycle(Integer id);
    void triggerReminderForCycle(Integer id);
    List<RecruitmentCycleResponseDTO> getClubCycles(Integer clubId, UserPrincipal currentUser);
    RecruitmentCycleResponseDTO createClubCycle(Integer clubId, RecruitmentCycleRequestDTO dto, UserPrincipal currentUser);
    RecruitmentCycleResponseDTO changeClubCycleStatus(Integer id, String status, UserPrincipal currentUser);
    List<RecruitmentCycleResponseDTO> getSeasonClubCycles(Integer seasonId, UserPrincipal currentUser);
}

