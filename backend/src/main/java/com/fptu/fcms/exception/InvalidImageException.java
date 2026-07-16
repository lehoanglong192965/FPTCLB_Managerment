package com.fptu.fcms.exception;

import org.springframework.http.HttpStatus;

public class InvalidImageException extends BusinessRuleException {

    public InvalidImageException(String message) {
        super(ApiErrorCode.INVALID_IMAGE.name(), message, HttpStatus.BAD_REQUEST);
    }
}
