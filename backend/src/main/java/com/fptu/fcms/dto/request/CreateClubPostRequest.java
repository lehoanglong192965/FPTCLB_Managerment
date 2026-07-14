package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClubPostRequest {

    @NotBlank(message = "Nội dung bài đăng không được để trống")
    @Size(max = 5000, message = "Nội dung bài đăng không được vượt quá 5000 ký tự")
    private String content;
}
