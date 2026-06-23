package com.fptu.fcms.service;

import com.fptu.fcms.dto.SemesterDTO;
import com.fptu.fcms.dto.request.ForceCloseSemesterRequest;
import com.fptu.fcms.dto.response.SemesterCloseResponse;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface SemesterService {
    List<SemesterDTO> getAllSemesters();
    SemesterDTO getSemesterById(Integer id);
    SemesterDTO createSemester(SemesterDTO dto);
    SemesterDTO updateSemester(Integer id, SemesterDTO dto);
    void deleteSemester(Integer id);
    SemesterCloseResponse closeSemester(Integer semesterId, UserPrincipal currentUser);
    SemesterCloseResponse forceCloseSemester(Integer semesterId, ForceCloseSemesterRequest request, UserPrincipal currentUser);
    void sendSemesterSettlementWarnings();
    void sendSemesterEndDateWarnings();
    void autoCloseEndedSemesters();
}
