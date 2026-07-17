package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentStorageService {
    CloudinaryUploadResult uploadPdf(MultipartFile file, String folder);

    void deleteDocument(String publicId);
}
