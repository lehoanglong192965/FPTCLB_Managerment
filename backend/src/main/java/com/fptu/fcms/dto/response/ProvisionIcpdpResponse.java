package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.ProvisionIcpdpAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProvisionIcpdpResponse {
    private AdminUserResponse user;
    private ProvisionIcpdpAction action;
    private boolean whitelistAdded;
    private String message;
}
