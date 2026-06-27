package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import java.util.List;

public interface ClubRegistrationService {
    ClubRegistrationResponseDTO submitRegistration(ClubRegistrationRequestDTO request, Integer currentUserId);
    List<ClubRegistrationResponseDTO> getMyRegistrations(Integer currentUserId);
    List<ClubRegistrationResponseDTO> getRegistrations(String status);
    List<ClubRegistrationResponseDTO> getPendingRegistrations();
    ClubRegistrationResponseDTO getRegistrationById(Integer id);
    ClubRegistrationResponseDTO reviewRegistration(Integer id, ReviewRegistrationRequestDTO request, Integer reviewerId);
}
