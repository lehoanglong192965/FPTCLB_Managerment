package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.AIChatRequest;
import com.fptu.fcms.dto.response.AIChatResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface AIChatService {
    AIChatResponse chat(AIChatRequest request, UserPrincipal principal);
}
