package com.fptu.fcms.controller;

import com.fptu.fcms.dto.SemesterDTO;
import com.fptu.fcms.service.SemesterService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
public class SemesterController {

    @Autowired
    private SemesterService semesterService;

    @GetMapping
    public ResponseEntity<List<SemesterDTO>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SemesterDTO> getSemesterById(@PathVariable Integer id) {
        return ResponseEntity.ok(semesterService.getSemesterById(id));
    }

    @PostMapping
    public ResponseEntity<SemesterDTO> createSemester(@Valid @RequestBody SemesterDTO semesterDTO) {
        return ResponseEntity.ok(semesterService.createSemester(semesterDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SemesterDTO> updateSemester(@PathVariable Integer id, @Valid @RequestBody SemesterDTO semesterDTO) {
        return ResponseEntity.ok(semesterService.updateSemester(id, semesterDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSemester(@PathVariable Integer id) {
        semesterService.deleteSemester(id);
        return ResponseEntity.noContent().build();
    }
}
