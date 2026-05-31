package com.fptu.fcms.exception;

import org.springframework.http.HttpStatus;

/**
 * Ném ra khi một yêu cầu vi phạm Business Rule của hệ thống.
 * Mặc định HTTP 422 để phân biệt với lỗi validation (400) và lỗi hệ thống (500).
 */
public class BusinessRuleException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public BusinessRuleException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.status = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    public BusinessRuleException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public HttpStatus getStatus()   { return status; }
    public String getErrorCode()    { return errorCode; }
}
