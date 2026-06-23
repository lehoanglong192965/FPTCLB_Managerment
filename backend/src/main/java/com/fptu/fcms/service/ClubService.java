package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.ClubResponseDTO;
import java.util.List;

public interface ClubService {
    List<ClubResponseDTO> getAllActiveClubs();
    ClubResponseDTO getClubByCode(String clubCode);
    void updateClubStatus(Integer clubId, String status, String reason);
}
