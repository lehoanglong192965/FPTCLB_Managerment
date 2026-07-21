package com.fptu.fcms.controller;

import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
public class EventExportController {

    private static final MediaType CSV_MEDIA_TYPE = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final EventExportService eventExportService;

    @GetMapping("/{eventId}/registrations/export")
    public ResponseEntity<byte[]> exportRegistrations(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return csvAttachment(
                eventExportService.exportRegistrations(eventId, principal).content(),
                eventId,
                "registrations"
        );
    }

    @GetMapping("/{eventId}/attendance/export")
    public ResponseEntity<byte[]> exportAttendance(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return csvAttachment(
                eventExportService.exportAttendance(eventId, principal).content(),
                eventId,
                "attendance"
        );
    }

    private ResponseEntity<byte[]> csvAttachment(byte[] content, Integer eventId, String exportType) {
        String filename = "event-" + eventId + "-" + exportType + ".csv";
        return ResponseEntity.ok()
                .contentType(CSV_MEDIA_TYPE)
                .contentLength(content.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store, max-age=0")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header("X-Content-Type-Options", "nosniff")
                .body(content);
    }
}
