package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.ImageUploadResponse;
import com.fptu.fcms.enums.ImageUploadPurpose;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface UploadService {
    ImageUploadResponse uploadImage(MultipartFile file, ImageUploadPurpose purpose);

    Resource loadReportAsResource(String filename);
}
