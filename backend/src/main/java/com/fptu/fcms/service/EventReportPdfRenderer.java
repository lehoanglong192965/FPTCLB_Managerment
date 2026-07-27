package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EvidenceMetadata;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;

public interface EventReportPdfRenderer {
    byte[] renderPdf(
            EventReportSnapshot snapshot,
            AutomaticEventReportRequest leaderComments,
            EvidenceMetadata evidenceMetadata,
            String authorName
    );
}
