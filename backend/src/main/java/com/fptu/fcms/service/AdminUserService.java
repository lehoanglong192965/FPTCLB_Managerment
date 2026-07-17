package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateIcpdpRequest;
import com.fptu.fcms.dto.response.ProvisionIcpdpResponse;

public interface AdminUserService {
    ProvisionIcpdpResponse provisionIcpdp(CreateIcpdpRequest request, Integer currentAdminId);
}
