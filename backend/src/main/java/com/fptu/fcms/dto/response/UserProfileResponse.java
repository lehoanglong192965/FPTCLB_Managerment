package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Integer userId;
    private String email;
    private String fullName;
    private String major;
    private Integer roleId;
    private String studentId;
    private String phoneNumber;
}
