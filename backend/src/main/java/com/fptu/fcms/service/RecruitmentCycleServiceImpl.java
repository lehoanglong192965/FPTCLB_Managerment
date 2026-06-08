package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.RecruitmentCycleRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentCycleResponseDTO;
import com.fptu.fcms.entity.RecruitmentCycle;
import com.fptu.fcms.repository.RecruitmentCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecruitmentCycleServiceImpl implements RecruitmentCycleService {

    private final RecruitmentCycleRepository cycleRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public RecruitmentCycleResponseDTO createCycle(RecruitmentCycleRequestDTO dto) {
        RecruitmentCycle c = new RecruitmentCycle();
        c.setTitle(dto.getTitle());
        c.setQuestionsJson(dto.getQuestionsJson());
        c.setStartDate(dto.getStartDate());
        c.setStatus(dto.getStatus() == null ? "Open" : dto.getStatus());
        c.setCreatedAt(LocalDateTime.now());
        c.setIsDeleted(false);
        c.setReminded(false);

        RecruitmentCycle saved = cycleRepository.save(c);
        return toDto(saved);
    }

    @Override
    @Transactional
    public RecruitmentCycleResponseDTO updateCycle(Integer id, RecruitmentCycleRequestDTO dto) {
        RecruitmentCycle existing = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));

        existing.setTitle(dto.getTitle());
        existing.setQuestionsJson(dto.getQuestionsJson());
        existing.setStartDate(dto.getStartDate());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());

        RecruitmentCycle updated = cycleRepository.save(existing);
        return toDto(updated);
    }

    @Override
    public RecruitmentCycleResponseDTO getCycleById(Integer id) {
        RecruitmentCycle c = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));
        return toDto(c);
    }

    @Override
    public List<RecruitmentCycleResponseDTO> getAllCycles() {
        return cycleRepository.findAll()
                .stream()
                .filter(c -> c.getIsDeleted() == null || !c.getIsDeleted())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void softDeleteCycle(Integer id) {
        RecruitmentCycle c = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));
        c.setIsDeleted(true);
        cycleRepository.save(c);
    }

    @Override
    @Transactional
    public void triggerReminderForCycle(Integer id) {
        RecruitmentCycle c = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));
        notificationService.notifyAdminCloseOrExtend(c);
        c.setReminded(true);
        cycleRepository.save(c);
    }

    private RecruitmentCycleResponseDTO toDto(RecruitmentCycle c) {
        RecruitmentCycleResponseDTO dto = new RecruitmentCycleResponseDTO();
        dto.setCycleID(c.getCycleID());
        dto.setTitle(c.getTitle());
        dto.setQuestionsJson(c.getQuestionsJson());
        dto.setStatus(c.getStatus());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setStartDate(c.getStartDate());
        dto.setClosedAt(c.getClosedAt());
        dto.setReminded(c.getReminded());
        return dto;
    }
}

