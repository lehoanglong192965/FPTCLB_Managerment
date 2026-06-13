package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FoundingMemberDTO {
    @NotBlank(message = "MSSV của thành viên sáng lập không được để trống")
    private String studentId;

    @NotBlank(message = "Họ tên của thành viên sáng lập không được để trống")
    private String fullName;

    @NotBlank(message = "Email của thành viên sáng lập không được để trống")
    private String email;

    @NotBlank(message = "Số điện thoại của thành viên sáng lập không được để trống")
    private String phoneNumber;

    private String cohort;
    private String clazz;
    private String facebookLink;
    private String cardImage;
}
