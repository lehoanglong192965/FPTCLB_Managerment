package com.fptu.fcms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO cho DisciplineLog — dùng cho cả request (Create/Update) và response.
 *
 * Validation áp dụng "Semi-Strict":
 *   - userID, semesterID bắt buộc (referential validation ở Service layer).
 *   - reason bắt buộc, giới hạn độ dài.
 *   - disciplineStatus bắt buộc (ví dụ: "Active", "Resolved").
 *   - disciplineID và createdAt chỉ dùng cho response (không validate khi tạo).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DisciplineLogDTO {

    private Integer disciplineID;

    @NotNull(message = "userID must not be null")
    private Integer userID;

    @NotNull(message = "semesterID must not be null")
    private Integer semesterID;

    @NotBlank(message = "reason must not be blank")
    @Size(max = 500, message = "reason must not exceed 500 characters")
    private String reason;

    @NotBlank(message = "disciplineStatus must not be blank")
    @Pattern(regexp = "^(Active|Expired)$", message = "disciplineStatus must be either 'Active' or 'Expired'")
    private String disciplineStatus;

    private LocalDateTime createdAt;
}
