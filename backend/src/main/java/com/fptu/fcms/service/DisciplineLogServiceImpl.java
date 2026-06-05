package com.fptu.fcms.service;

import com.fptu.fcms.dto.DisciplineLogDTO;
import com.fptu.fcms.entity.DisciplineLog;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisciplineLogServiceImpl implements DisciplineLogService {

    private final DisciplineLogRepository disciplineLogRepository;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DisciplineLogDTO> getAllDisciplineLogs() {
        return disciplineLogRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DisciplineLogDTO getDisciplineLogById(Integer id) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));
        return mapToDTO(log);
    }

    @Override
    @Transactional
    public DisciplineLogDTO createDisciplineLog(DisciplineLogDTO dto) {
        validateReferences(dto.getUserID(), dto.getSemesterID());

        DisciplineLog log = new DisciplineLog();
        log.setUserID(dto.getUserID());
        log.setSemesterID(dto.getSemesterID());
        log.setReason(dto.getReason());
        log.setDisciplineStatus(dto.getDisciplineStatus());
        log.setCreatedAt(LocalDateTime.now());
        log.setIsDeleted(false);

        log = disciplineLogRepository.save(log);
        return mapToDTO(log);
    }

    @Override
    @Transactional
    public DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));

        log.setReason(dto.getReason());
        log.setDisciplineStatus(dto.getDisciplineStatus());

        log = disciplineLogRepository.save(log);
        return mapToDTO(log);
    }

    @Override
    @Transactional
    public void deleteDisciplineLog(Integer id) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));

        log.setIsDeleted(true);
        disciplineLogRepository.save(log);
    }

    private void validateReferences(Integer userID, Integer semesterID) {
        if (!userRepository.existsById(userID)) {
            throw new IllegalArgumentException("Invalid User reference");
        }
        if (!semesterRepository.existsById(semesterID)) {
            throw new IllegalArgumentException("Invalid Semester reference");
        }
    }

    private DisciplineLogDTO mapToDTO(DisciplineLog entity) {
        DisciplineLogDTO dto = new DisciplineLogDTO();
        dto.setDisciplineID(entity.getDisciplineID());
        dto.setUserID(entity.getUserID());
        dto.setSemesterID(entity.getSemesterID());
        dto.setReason(entity.getReason());
        dto.setDisciplineStatus(entity.getDisciplineStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
