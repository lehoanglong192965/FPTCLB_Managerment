package com.fptu.fcms.service;

import com.fptu.fcms.dto.SemesterDTO;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;

    @Override
    public List<SemesterDTO> getAllSemesters() {
        return semesterRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public SemesterDTO getSemesterById(Integer id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        return mapToDTO(semester);
    }

    @Override
    @Transactional
    public SemesterDTO createSemester(SemesterDTO dto) {
        validateDates(dto.getStartDate(), dto.getEndDate());
        
        if (semesterRepository.existsOverlappingSemester(dto.getStartDate(), dto.getEndDate(), null)) {
            throw new BusinessRuleException("New semester dates overlap with an existing semester");
        }

        Semester semester = new Semester();
        semester.setSemesterCode(dto.getSemesterCode());
        semester.setStartDate(dto.getStartDate());
        semester.setEndDate(dto.getEndDate());
        semester.setIsDeleted(false);
        
        boolean isActivating = dto.getIsActive() != null && dto.getIsActive();
        semester.setIsActive(isActivating);
        
        if (isActivating) {
            deactivateOtherSemesters();
            semesterRepository.flush();
        }

        semester = semesterRepository.save(semester);
        return mapToDTO(semester);
    }

    @Override
    @Transactional
    public SemesterDTO updateSemester(Integer id, SemesterDTO dto) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));

        if (semester.getEndDate().isBefore(LocalDate.now()) && 
            (!semester.getStartDate().equals(dto.getStartDate()) || !semester.getEndDate().equals(dto.getEndDate()))) {
            throw new BusinessRuleException("Cannot update dates of a semester that has already ended");
        }

        validateDates(dto.getStartDate(), dto.getEndDate());
        
        if (semesterRepository.existsOverlappingSemester(dto.getStartDate(), dto.getEndDate(), id)) {
            throw new BusinessRuleException("Updated dates overlap with another existing semester");
        }

        semester.setSemesterCode(dto.getSemesterCode());
        semester.setStartDate(dto.getStartDate());
        semester.setEndDate(dto.getEndDate());
        
        boolean isActivating = dto.getIsActive() != null && dto.getIsActive();
        if (isActivating && !Boolean.TRUE.equals(semester.getIsActive())) {
            deactivateOtherSemesters();
            semesterRepository.flush();
        }
        semester.setIsActive(isActivating);

        semester = semesterRepository.save(semester);
        return mapToDTO(semester);
    }

    @Override
    @Transactional
    public void deleteSemester(Integer id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        
        if (Boolean.TRUE.equals(semester.getIsActive())) {
            throw new BusinessRuleException("Cannot delete a semester that is currently active");
        }

        semester.setIsDeleted(true);
        semester.setIsActive(false);
        semesterRepository.save(semester);
    }

    private void deactivateOtherSemesters() {
        List<Semester> activeSemesters = semesterRepository.findByIsActiveTrue();
        for (Semester s : activeSemesters) {
            s.setIsActive(false);
            semesterRepository.save(s);
        }
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
    }

    private SemesterDTO mapToDTO(Semester entity) {
        SemesterDTO dto = new SemesterDTO();
        dto.setSemesterID(entity.getSemesterID());
        dto.setSemesterCode(entity.getSemesterCode());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setIsActive(entity.getIsActive());
        dto.setIsDeleted(entity.getIsDeleted());
        return dto;
    }
}
