package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.RecruitmentCycleRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentCycleResponseDTO;

import java.util.List;

public interface RecruitmentCycleService {
    RecruitmentCycleResponseDTO createCycle(RecruitmentCycleRequestDTO dto);
    RecruitmentCycleResponseDTO updateCycle(Integer id, RecruitmentCycleRequestDTO dto);
    RecruitmentCycleResponseDTO getCycleById(Integer id);
    List<RecruitmentCycleResponseDTO> getAllCycles();
    void softDeleteCycle(Integer id);
    void triggerReminderForCycle(Integer id);
}

