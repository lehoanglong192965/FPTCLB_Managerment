package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.ImageUploadResponse;
import com.fptu.fcms.enums.ImageUploadPurpose;
import com.fptu.fcms.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    @PostMapping("/card-image")
    public ResponseEntity<ImageUploadResponse> uploadCardImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "purpose", required = false) String purpose
    ) {
        ImageUploadResponse response = uploadService.uploadImage(file, ImageUploadPurpose.fromApiValue(purpose));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getUploadedFile(@PathVariable String filename) {
        Resource resource = uploadService.loadReportAsResource(filename);

        String contentType = null;
        try {
            Path filePath = resource.getFile().toPath();
            contentType = Files.probeContentType(filePath);
        } catch (IOException ex) {
            // Fall back to extension-based/default content type below.
        }
        String resourceName = resource.getFilename();
        if (contentType == null && resourceName != null && resourceName.toLowerCase().endsWith(".pdf")) {
            contentType = MediaType.APPLICATION_PDF_VALUE;
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
