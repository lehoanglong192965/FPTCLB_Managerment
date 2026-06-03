package com.fptu.fcms.service;

import com.fptu.fcms.dto.DisciplineLogDTO;
import com.fptu.fcms.entity.DisciplineLog;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.repository.SemesterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý CRUD cho DisciplineLog.
 *
 * Chiến lược validation: Semi-Strict
 *   - Referential validation: userID và semesterID phải tồn tại trong DB.
 *   - Không ràng buộc thời gian (cho phép tạo log ở học kỳ quá khứ/tương lai
 *     để Admin/ICPDP dễ dàng setup dữ liệu kiểm thử).
 *   - Soft Delete: set isDeleted = true thay vì xóa vật lý.
 */
@Service
public class DisciplineLogService {

    @Autowired
    private DisciplineLogRepository disciplineLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    /**
     * Lấy danh sách tất cả DisciplineLog (chỉ các bản ghi chưa bị soft-delete,
     * nhờ @SQLRestriction trên entity).
     */
    @Transactional(readOnly = true)
    public List<DisciplineLogDTO> getAllDisciplineLogs() {
        return disciplineLogRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy DisciplineLog theo ID.
     *
     * @throws IllegalArgumentException nếu không tìm thấy (→ 400 Bad Request)
     */
    @Transactional(readOnly = true)
    public DisciplineLogDTO getDisciplineLogById(Integer id) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));
        return mapToDTO(log);
    }

    /**
     * Tạo mới DisciplineLog.
     * Validate: userID và semesterID phải tồn tại trong DB (referential integrity).
     */
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

    /**
     * Cập nhật DisciplineLog.
     * Chỉ cho phép sửa: reason, disciplineStatus.
     * Không cho phép sửa: userID, semesterID (nếu sai thì soft-delete rồi tạo mới).
     */
    @Transactional
    public DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));

        log.setReason(dto.getReason());
        log.setDisciplineStatus(dto.getDisciplineStatus());

        log = disciplineLogRepository.save(log);
        return mapToDTO(log);
    }

    /**
     * Xóa mềm DisciplineLog (set isDeleted = true).
     */
    @Transactional
    public void deleteDisciplineLog(Integer id) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));

        log.setIsDeleted(true);
        disciplineLogRepository.save(log);
    }

    // =========================================================================
    // VALIDATION HELPERS
    // =========================================================================

    /**
     * Kiểm tra userID và semesterID có tồn tại trong DB hay không.
     * Ném IllegalArgumentException nếu không hợp lệ (→ 400 Bad Request).
     */
    private void validateReferences(Integer userID, Integer semesterID) {
        if (!userRepository.existsById(userID)) {
            throw new IllegalArgumentException("Invalid User reference");
        }
        if (!semesterRepository.existsById(semesterID)) {
            throw new IllegalArgumentException("Invalid Semester reference");
        }
    }

    // =========================================================================
    // MAPPING HELPERS
    // =========================================================================

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
