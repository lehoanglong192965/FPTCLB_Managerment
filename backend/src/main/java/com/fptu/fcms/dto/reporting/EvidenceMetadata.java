package com.fptu.fcms.dto.reporting;

public record EvidenceMetadata(
        String registrationFilename,
        int registrationRowCount,
        String registrationHash,
        String attendanceFilename,
        int attendanceRowCount,
        String attendanceHash,
        String reportDataHash
) {}
