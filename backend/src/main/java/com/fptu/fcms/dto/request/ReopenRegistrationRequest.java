package com.fptu.fcms.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Payload mở lại đăng ký cho sự kiện đã đóng đăng ký")
public class ReopenRegistrationRequest {

    @Schema(description = "Thời gian đóng đăng ký mới, phải ở tương lai và không vượt quá giờ bắt đầu sự kiện",
            example = "2026-08-14T23:59:00")
    @NotNull
    private LocalDateTime registrationCloseAt;
}
