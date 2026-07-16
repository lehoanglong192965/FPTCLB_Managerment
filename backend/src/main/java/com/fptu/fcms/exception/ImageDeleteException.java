package com.fptu.fcms.exception;

import org.springframework.http.HttpStatus;

public class ImageDeleteException extends BusinessRuleException {

    public ImageDeleteException(String message) {
        super(ApiErrorCode.IMAGE_DELETE_FAILED.name(), message, HttpStatus.BAD_GATEWAY);
    }

    public ImageDeleteException(String message, Throwable cause) {
        super(ApiErrorCode.IMAGE_DELETE_FAILED.name(), message, HttpStatus.BAD_GATEWAY);
        initCause(cause);
    }
}
