package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.service.ReportUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {

    private final ReportUploadService reportUploadService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> createReport(@Valid @ModelAttribute CreateEventReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportUploadService.uploadEventReport(request));
    }
}
