package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.UpdateClubRequest;
import com.fptu.fcms.dto.response.ClubResponseDTO;
import java.util.List;

public interface ClubService {
    List<ClubResponseDTO> getAllActiveClubs();
    ClubResponseDTO getClubByCode(String clubCode);
    ClubResponseDTO getClubById(Integer clubId);
    ClubResponseDTO updateClub(Integer clubId, UpdateClubRequest request);
    void updateClubStatus(Integer clubId, String status, String reason);
}
