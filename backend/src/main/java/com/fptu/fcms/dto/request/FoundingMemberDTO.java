package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class FoundingMemberDTO {
    @NotBlank(message = "MSSV của thành viên sáng lập không được để trống")
    private String studentId;

    @NotBlank(message = "Vai trò dự kiến không được để trống (Leader/ViceLeader/Member)")
    private String proposedRole;

    @NotBlank(message = "Họ tên của thành viên sáng lập không được để trống")
    private String fullName;

    @NotBlank(message = "Email của thành viên sáng lập không được để trống")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$", message = "Email thành viên sáng lập không đúng định dạng")
    private String email;

    @NotBlank(message = "Số điện thoại của thành viên sáng lập không được để trống")
    @Pattern(regexp = "^(0[3|5|7|8|9])[0-9]{8}$", message = "Số điện thoại thành viên sáng lập không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09)")
    private String phoneNumber;

    private String cohort;
    private String clazz;
    private String facebookLink;
    private String cardImage;
}
