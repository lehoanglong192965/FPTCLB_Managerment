package com.fptu.fcms.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception tùy chỉnh đại diện cho vi phạm Business Rule.
 * Được ném ra khi một thao tác nghiệp vụ bị chặn bởi quy tắc hệ thống
 * (ví dụ: gán Leader cho sinh viên có án kỷ luật, hoặc gán quyền cho cán bộ ICPDP).
 *
 * GlobalExceptionHandler sẽ bắt exception này và trả về HTTP 422 (Unprocessable Entity)
 * kèm message mô tả lý do cụ thể.
 */
public class BusinessRuleException extends RuntimeException {

    // HTTP status tương ứng với lỗi nghiệp vụ này
    private final HttpStatus status;
    private final String errorCode;

    /**
     * Constructor mặc định: dùng HTTP 422 Unprocessable Entity
     *
     * @param message mô tả lý do vi phạm nghiệp vụ (sẽ trả về client)
     */
    public BusinessRuleException(String message) {
        super(message);
        this.status = HttpStatus.UNPROCESSABLE_ENTITY;
        this.errorCode = ApiErrorCode.BUSINESS_RULE_VIOLATION.name();
    }

    /**
     * Constructor mở rộng: cho phép chỉ định HTTP status tùy ý
     *
     * @param message mô tả lý do vi phạm nghiệp vụ
     * @param status  HTTP status code muốn trả về (VD: 400, 403, 409...)
     */
    public BusinessRuleException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = status == null ? ApiErrorCode.BUSINESS_RULE_VIOLATION.name() : status.name();
    }

    public BusinessRuleException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.status = status == null ? HttpStatus.UNPROCESSABLE_ENTITY : status;
        this.errorCode = errorCode == null ? ApiErrorCode.BUSINESS_RULE_VIOLATION.name() : errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
