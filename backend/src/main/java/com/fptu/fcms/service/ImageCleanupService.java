package com.fptu.fcms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageCleanupService {

    private final ImageStorageService imageStorageService;

    public void deleteAfterCommit(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    deleteQuietly(publicId);
                }
            });
        } else {
            deleteQuietly(publicId);
        }
    }

    public void deleteQuietly(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }
        try {
            imageStorageService.deleteImage(publicId);
        } catch (RuntimeException ex) {
            log.warn("Could not delete image from Cloudinary. publicId={}", publicId, ex);
        }
    }
}
