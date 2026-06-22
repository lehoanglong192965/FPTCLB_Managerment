package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNotificationRequest {

    @Size(max = 255, message = "Tiêu đề thông báo không được vượt quá 255 ký tự")
    private String title;

    @Size(max = 50, message = "Loại thông báo không được vượt quá 50 ký tự")
    private String notificationType;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    @Size(max = 5000, message = "Nội dung thông báo không được vượt quá 5000 ký tự")
    private String content;
}