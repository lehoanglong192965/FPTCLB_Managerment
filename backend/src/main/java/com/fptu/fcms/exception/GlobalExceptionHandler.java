package com.fptu.fcms.exception;

import com.fptu.fcms.dto.response.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

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

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // =====================================================================
    // XỬ LÝ LỖI NGHIỆP VỤ (BusinessRuleException)
    // =====================================================================

    /**
     * Bắt BusinessRuleException ném từ Service layer (vi phạm quy tắc nghiệp vụ).
     * Trả về HTTP status được chỉ định trong exception (mặc định 422).
     */
    @ExceptionHandler(SemesterClosureBlockedException.class)
    public ResponseEntity<Map<String, Object>> handleSemesterClosureBlocked(SemesterClosureBlockedException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", ex.getStatus().value());
        body.put("error", ex.getStatus().getReasonPhrase());
        body.put("code", "SEMESTER_CLOSURE_BLOCKED");
        body.put("message", ex.getMessage());
        body.put("semesterId", ex.getSemesterId());
        body.put("unfinishedEventCount", ex.getUnfinishedEventCount());
        body.put("lockedScoreCount", ex.getLockedScoreCount());
        body.put("blockers", ex.getBlockers());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessRuleException(BusinessRuleException ex) {
        return buildErrorResponse(ex.getStatus(), ex.getErrorCode(), ex.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String reason = ex.getReason();
        String message = StringUtils.hasText(reason) ? reason : status.getReasonPhrase();
        String code = StringUtils.hasText(reason) ? reason : status.name();
        return buildErrorResponse(status, code, message);
    }

    // =====================================================================
    // XỬ LÝ LỖI KHÔNG TÌM THẤY TÀI NGUYÊN
    // =====================================================================

    /**
     * Bắt IllegalArgumentException - thường dùng khi resource không tồn tại
     * hoặc tham số đầu vào không hợp lệ.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST.name(), ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT.name(), ex.getMessage());
    }

    // =====================================================================
    // XỬ LÝ LỖI VALIDATION (@Valid / @Validated)
    // =====================================================================

    /**
     * Bắt lỗi validation từ @Valid annotation trên DTO (Bean Validation).
     * Tổng hợp tất cả field error thành một chuỗi để trả về.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        // Gộp tất cả lỗi field thành chuỗi, ví dụ: "clubID: không được để trống; userID: phải lớn hơn 0"
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR.name(), message);
    }

    // =====================================================================
    // XỬ LÝ LỖI KHÔNG MONG ĐỢI (fallback)
    // =====================================================================

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return buildErrorResponse(
                HttpStatus.FORBIDDEN,
                ApiErrorCode.FORBIDDEN.name(),
                "Ban khong co quyen truy cap tai nguyen nay!"
        );
    }

    /**
     * Bắt mọi exception không được handle ở trên.
     * Không expose stack trace ra ngoài — chỉ trả về thông điệp chung.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        LOGGER.warn("Data integrity violation", ex);
        return buildErrorResponse(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT.name(), "Data conflicts with an existing record.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        // Keep diagnostic detail in server logs; clients receive a stable generic message.
        LOGGER.error("Unhandled application exception", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL_ERROR.name(), "An unexpected error occurred.");
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
    private ResponseEntity<ApiErrorResponse> buildErrorResponse(HttpStatus status, String code, String message) {
        ApiErrorResponse body = new ApiErrorResponse(
                false,
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message
        );
        return ResponseEntity.status(status).body(body);
    }
}

