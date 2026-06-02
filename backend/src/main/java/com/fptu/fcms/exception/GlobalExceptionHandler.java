package com.fptu.fcms.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Bộ xử lý exception toàn cục cho toàn bộ ứng dụng.
 * Đảm bảo tất cả lỗi đều được trả về dạng JSON chuẩn hóa thay vì
 * Spring Boot default error page.
 *
 * Cấu trúc response lỗi:
 * {
 *   "timestamp": "...",
 *   "status": 422,
 *   "error": "Unprocessable Entity",
 *   "message": "Lý do lỗi cụ thể"
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // =====================================================================
    // XỬ LÝ LỖI NGHIỆP VỤ (BusinessRuleException)
    // =====================================================================

    /**
     * Bắt BusinessRuleException ném từ Service layer (vi phạm quy tắc nghiệp vụ).
     * Trả về HTTP status được chỉ định trong exception (mặc định 422).
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRuleException(BusinessRuleException ex) {
        return buildErrorResponse(ex.getStatus(), ex.getMessage());
    }

    // =====================================================================
    // XỬ LÝ LỖI KHÔNG TÌM THẤY TÀI NGUYÊN
    // =====================================================================

    /**
     * Bắt IllegalArgumentException - thường dùng khi resource không tồn tại
     * hoặc tham số đầu vào không hợp lệ.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // =====================================================================
    // XỬ LÝ LỖI VALIDATION (@Valid / @Validated)
    // =====================================================================

    /**
     * Bắt lỗi validation từ @Valid annotation trên DTO (Bean Validation).
     * Tổng hợp tất cả field error thành một chuỗi để trả về.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        // Gộp tất cả lỗi field thành chuỗi, ví dụ: "clubID: không được để trống; userID: phải lớn hơn 0"
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    // =====================================================================
    // XỬ LÝ LỖI KHÔNG MONG ĐỢI (fallback)
    // =====================================================================

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return buildErrorResponse(
                HttpStatus.FORBIDDEN,
                "Bạn không có quyền truy cập tài nguyên này!"
        );
    }

    /**
     * Bắt mọi exception không được handle ở trên.
     * Không expose stack trace ra ngoài — chỉ trả về thông điệp chung.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Lỗi hệ thống nội bộ. Vui lòng thử lại sau."
        );
    }

    // =====================================================================
    // HELPER: Tạo response body chuẩn hóa
    // =====================================================================

    /**
     * Tạo response body JSON chuẩn hóa cho tất cả lỗi.
     *
     * @param status  HTTP status
     * @param message mô tả lỗi
     * @return ResponseEntity với body JSON
     */
    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}