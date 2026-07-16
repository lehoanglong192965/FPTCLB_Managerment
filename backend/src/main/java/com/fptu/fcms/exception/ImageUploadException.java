package com.fptu.fcms.exception;

import org.springframework.http.HttpStatus;

public class ImageUploadException extends BusinessRuleException {

    public ImageUploadException(String message) {
        super(ApiErrorCode.IMAGE_UPLOAD_FAILED.name(), message, HttpStatus.BAD_GATEWAY);
    }

    public ImageUploadException(String message, Throwable cause) {
        super(ApiErrorCode.IMAGE_UPLOAD_FAILED.name(), message, HttpStatus.BAD_GATEWAY);
        initCause(cause);
    }
}
