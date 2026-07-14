package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.UpdateClubRequest;
import com.fptu.fcms.dto.response.ClubManagementSummaryDTO;
import com.fptu.fcms.dto.response.ClubResponseDTO;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.service.ClubService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubServiceImpl implements ClubService {

    private final ClubRepository clubRepository;
    private final ClubMembershipRepository clubMembershipRepository;

    @Override
    public List<ClubResponseDTO> getAllActiveClubs() {
        return clubRepository.findByClubStatusAndIsDeletedFalse("Active").stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ClubManagementSummaryDTO> getAllClubsForManagement() {
        return clubRepository.findByIsDeletedFalseOrderByClubNameAsc().stream()
                .map(club -> new ClubManagementSummaryDTO(
                        club.getClubID(),
                        club.getClubName(),
                        club.getClubStatus()
                ))
                .toList();
    }

    @Override
    public ClubResponseDTO getClubByCode(String clubCode) {
        return clubRepository.findByClubCodeAndIsDeletedFalse(clubCode)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Override
    public ClubResponseDTO getClubById(Integer clubId) {
        return clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy câu lạc bộ."));
    }

    @Override
    @Transactional
    public ClubResponseDTO updateClub(Integer clubId, UpdateClubRequest request) {
        Club club = clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy câu lạc bộ."));
        if (request.getClubName() != null && !request.getClubName().isBlank()) {
            club.setClubName(request.getClubName());
        }
        if (request.getDescription() != null) {
            club.setDescription(request.getDescription());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            club.setCategory(request.getCategory());
        }
        if (request.getClubImage() != null) {
            club.setClubImage(request.getClubImage().isBlank() ? null : request.getClubImage());
        }
        if (request.getContactEmail() != null) {
            club.setContactEmail(request.getContactEmail().isBlank() ? null : request.getContactEmail());
        }
        if (request.getContactPhone() != null) {
            club.setContactPhone(request.getContactPhone().isBlank() ? null : request.getContactPhone());
        }
        if (request.getFacebookUrl() != null) {
            club.setFacebookUrl(request.getFacebookUrl().isBlank() ? null : request.getFacebookUrl());
        }
        clubRepository.save(club);
        return convertToDTO(club);
    } // <-- Đã thêm dấu đóng ngoặc bị thiếu ở đây

    @Override
    @Transactional // Nên thêm Transactional đối với các thao tác update trạng thái dữ liệu
    public void updateClubStatus(Integer clubId, String status, String reason) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));
        club.setClubStatus(status);
        
        // TODO: Nếu entity Club có trường lưu lý do duyệt/từ chối, hãy set tại đây:
        // club.setStatusReason(reason); 
        
        clubRepository.save(club);
    }

    private ClubResponseDTO convertToDTO(Club club) {
        ClubResponseDTO dto = new ClubResponseDTO();
        dto.setClubID(club.getClubID());
        dto.setAbbr(club.getClubCode());
        dto.setName(club.getClubName());
        dto.setDesc(club.getDescription());
        
        // Null-safe category
        String category = club.getCategory();
        if (category == null || category.trim().isEmpty()) {
            category = "Công nghệ"; // Default fallback
        }
        dto.setTag(category);
        dto.setClubStatus(club.getClubStatus());
        
        // Derive emoji & color dynamically based on category
        dto.setEmoji(getEmojiForCategory(category));
        dto.setColor(getColorForCategory(category));
        
        // Get actual membership count
        int membersCount = clubMembershipRepository.countByClubIDAndIsDeletedFalse(club.getClubID());
        dto.setMembers(membersCount);
        
        // Default recruiting = true for active clubs
        dto.setRecruiting(true);
        dto.setClubImage(club.getClubImage());
        dto.setContactEmail(club.getContactEmail());
        dto.setContactPhone(club.getContactPhone());
        dto.setFacebookUrl(club.getFacebookUrl());

        return dto;
    }

    private String getEmojiForCategory(String category) {
        if (category == null) return "♣️";
        switch (category.trim()) {
            case "Công nghệ": return "💻";
            case "Thiết kế": return "🎨";
            case "Kỹ năng": return "🎤";
            case "AI & Data": return "🤖";
            case "Business": return "🏆";
            case "Ngôn ngữ": return "🌍";
            case "Nghệ thuật": return "📸";
            case "Thể thao": return "⚽";
            default: return "✨";
        }
    }

    private String getColorForCategory(String category) {
        if (category == null) return "#7F8C8D";
        switch (category.trim()) {
            case "Công nghệ": return "#1C3F94";
            case "Thiết kế": return "#9B2335";
            case "Kỹ năng": return "#5C3D99";
            case "AI & Data": return "#0A7A6B";
            case "Business": return "#D4770A";
            case "Ngôn ngữ": return "#1A6B3C";
            case "Nghệ thuật": return "#7A2D8A";
            case "Thể thao": return "#1A6095";
            default: return "#2C3E50";
        }
    }
}