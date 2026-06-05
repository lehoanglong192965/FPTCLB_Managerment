package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    @Builder.Default
    private String type = "Bearer";
    private String token;

    public AuthResponse(String token) {
        this.token = token;
    }
}
