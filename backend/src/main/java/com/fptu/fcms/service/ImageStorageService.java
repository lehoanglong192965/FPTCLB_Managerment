package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ImageStorageService {
    CloudinaryUploadResult uploadImage(MultipartFile file, String folder);

    List<CloudinaryUploadResult> uploadImages(List<MultipartFile> files, String folder);

    void deleteImage(String publicId);

    CloudinaryUploadResult replaceImage(MultipartFile newFile, String oldPublicId, String folder);
}
