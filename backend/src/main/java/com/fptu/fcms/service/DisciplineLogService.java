package com.fptu.fcms.service;

import com.fptu.fcms.dto.DisciplineLogDTO;

import java.util.List;

public interface DisciplineLogService {

    List<DisciplineLogDTO> getAllDisciplineLogs();

    DisciplineLogDTO getDisciplineLogById(Integer id);

    // Giữ method cũ để code cũ không lỗi
    DisciplineLogDTO createDisciplineLog(DisciplineLogDTO dto);

    // Thêm method mới có actorID để ghi log ai kỷ luật
    DisciplineLogDTO createDisciplineLog(DisciplineLogDTO dto, Integer actorID);

    // Giữ method cũ để code cũ không lỗi
    DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto);

    // Thêm method mới có actorID để ghi log ai update kỷ luật
    DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto, Integer actorID);

    void deleteDisciplineLog(Integer id);
}