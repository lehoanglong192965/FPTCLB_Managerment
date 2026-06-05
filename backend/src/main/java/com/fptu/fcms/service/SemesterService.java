package com.fptu.fcms.service;

import com.fptu.fcms.dto.SemesterDTO;

import java.util.List;

public interface SemesterService {
    List<SemesterDTO> getAllSemesters();
    SemesterDTO getSemesterById(Integer id);
    SemesterDTO createSemester(SemesterDTO dto);
    SemesterDTO updateSemester(Integer id, SemesterDTO dto);
    void deleteSemester(Integer id);
}
