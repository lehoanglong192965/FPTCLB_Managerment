package com.fptu.fcms.service;

import com.fptu.fcms.dto.DisciplineLogDTO;

import java.util.List;

public interface DisciplineLogService {
    List<DisciplineLogDTO> getAllDisciplineLogs();
    DisciplineLogDTO getDisciplineLogById(Integer id);
    DisciplineLogDTO createDisciplineLog(DisciplineLogDTO dto);
    DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto);
    void deleteDisciplineLog(Integer id);
}
